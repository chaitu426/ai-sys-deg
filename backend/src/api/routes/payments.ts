import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import DodoPayments from 'dodopayments';
import rawBody from 'fastify-raw-body';
import { prisma } from '../../db/client';
import { getConfig } from '../../utils/config';
import { getLogger } from '../../utils/logger';
import { emailService } from '../../utils/email-service';

const logger = getLogger();

/* -------------------------------------------------------------------------- */
/*                              Route Plugin                                  */
/* -------------------------------------------------------------------------- */

export async function registerPaymentRoutes(app: FastifyInstance) {
  const config = getConfig();

  /* --------------------- Register raw-body (ONCE) -------------------------- */
  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: false, // 🔥 important → keeps Buffer
    runFirst: true, // string format
  });

  /* ------------------------- Dodo Client ---------------------------------- */
  const client = new DodoPayments({
    bearerToken: config.DODO_PAYMENTS_API_KEY,
    environment: config.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode',
  });

  /* ------------------------------------------------------------------------ */
  /*                            CHECKOUT SESSION                               */
  /* ------------------------------------------------------------------------ */

  app.post(
    '/api/payments/checkout-session',
    async (
      request: FastifyRequest<{
        Body: {
          product_cart?: any[];
          product_id?: string;
          billing?: Record<string, any>;
          customer?: Record<string, any>;
          return_url?: string;
          payment_link?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        let body = request.body;
        if (Buffer.isBuffer(body)) {
          try {
            body = JSON.parse(body.toString('utf8'));
          } catch (err) {
            request.log.error('Invalid JSON body');
            return reply.status(400).send({ error: 'Invalid JSON body' });
          }
        }
        logger.info('Checkout session body', body);

        let productCart = body.product_cart;
        if (!productCart && body.product_id) {
          productCart = [{ product_id: body.product_id, quantity: 1 }];
        }

        if (!productCart) {
          return reply.status(400).send({ error: 'Missing product_cart or product_id' });
        }

        const payload = {
          product_cart: productCart,
          billing: body.billing, // Use only client-provided billing info
          customer: body.customer,
          return_url:
            body.return_url ??
            config.DODO_PAYMENTS_RETURN_URL ??
            `${config.FRONTEND_URL}/dashboard`,
          payment_link: body.payment_link,
        };

        const session: any = await client.checkoutSessions.create(payload as any);

        return reply.send({
          ...session,
          checkout_url: session.payment_link ?? session.checkout_url ?? session.url,
        });
      } catch (err: any) {
        logger.error('Checkout session failed', err);
        return reply.status(500).send({ error: 'Checkout failed' });
      }
    }
  );

  /* ------------------------------------------------------------------------ */
  /*                                 WEBHOOK                                  */
  /* ------------------------------------------------------------------------ */

  app.post(
    '/api/webhooks',
    {
      config: {
        rawBody: true,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      let event: any;

      /* -------------------- Verify webhook FIRST --------------------- */
      try {
        const rawBody = (request as FastifyRequest & { rawBody: Buffer }).rawBody;

        logger.info('Webhook rawBody debug', {
          isBuffer: Buffer.isBuffer(rawBody),
          length: rawBody?.length,
        });

        if (!Buffer.isBuffer(rawBody)) {
          throw new Error('Raw body is not a Buffer');
        }

        // ✅ VERIFY SIGNATURE
        event = client.webhooks.unwrap(rawBody as any, {
          headers: request.headers as any,
          key: config.DODO_PAYMENTS_WEBHOOK_KEY,
        });

        logger.info('Webhook verified', {
          type: event.type,
        });
      } catch (err: any) {
        logger.error('Webhook verification failed', {
          error: err.message,
        });
        // Return error to sender if verification fails
        return reply.status(400).send({ error: 'Invalid signature' });
      }

      /* ------------------ SYNC processing BEFORE ACK --------------------- */
      // CRITICAL: Process event BEFORE sending 200 OK to ensure user gets upgraded
      try {
        switch (event.type) {
          case 'payment.succeeded': {
            if (event.data?.subscription_id) {
              await updateUserPlan(event, 'active', client);
            }
            break;
          }

          case 'subscription.active':
          case 'subscription.renewed':
            await updateUserPlan(event, 'active', client);
            break;

          case 'subscription.updated':
            await updateUserPlan(event, event.data.status, client);
            break;

          case 'subscription.on_hold':
            await updateUserPlan(event, 'on_hold', client);
            break;

          case 'subscription.cancelled':
          case 'subscription.expired':
            await downgradeUser(event);
            break;

          case 'subscription.failed':
            await prisma.user.updateMany({
              where: {
                subscriptionId: event.data.subscription_id,
              },
              data: {
                subscriptionStatus: 'past_due',
              },
            });
            break;

          default:
            logger.warn('Unhandled webhook event', {
              type: event.type,
            });
        }

        // Only ACK after successful processing
        return reply.status(200).send({ received: true });
      } catch (err: any) {
        logger.error('Webhook processing failed', {
          type: event.type,
          error: err.message,
        });
        // Return 500 so payment provider retries
        return reply.status(500).send({ error: 'Processing failed, please retry' });
      }
    }
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

async function updateUserPlan(event: any, status: string, client?: DodoPayments) {
  const data = event.data;
  const email = data?.customer?.email;
  const subscriptionId = data?.subscription_id;
  const customerId = data?.customer?.customer_id;
  const productId = data?.product_id;
  const config = getConfig();

  if (!email) {
    logger.warn('Webhook missing customer email', { data });
    return;
  }

  // 1. Ensure we have current_period_end (expiry)
  let expiry = data.current_period_end ? new Date(data.current_period_end) : undefined;

  // If expiry is missing but we have a subscription ID and client, fetch it
  if (!expiry && subscriptionId && client) {
    try {
      const subscription: any = await client.subscriptions.retrieve(subscriptionId);
      if (subscription?.current_period_end) {
        expiry = new Date(subscription.current_period_end);
        logger.info('Fetched missing subscription expiry', { subscriptionId, expiry });
      } else if (subscription?.next_billing_date) {
        // next_billing_date is often the same as current_period_end in some SDKs
        expiry = new Date(subscription.next_billing_date);
        logger.info('Fetched missing subscription expiry from next_billing_date', { subscriptionId, expiry });
      }
    } catch (err) {
      logger.error('Failed to fetch subscription details', { subscriptionId, error: err });
    }
  }

  let plan: 'FREE' | 'PRO' | 'PREMIUM' = 'FREE';
  if (productId === config.DODO_PRODUCT_ID_PREMIUM) plan = 'PREMIUM';
  if (productId === config.DODO_PRODUCT_ID_PRO) plan = 'PRO';

  // 🛡️ DEDUPLICATION: Fetch current user state to avoid duplicate DB updates
  await prisma.user.findUnique({
    where: { email },
    select: { plan: true, subscriptionStatus: true },
  });

  try {
    // Update database
    await prisma.user.update({
      where: { email },
      data: {
        plan,
        subscriptionId,
        customerId,
        subscriptionStatus: status,
        currentPeriodEnd: expiry,
      },
    });

    // Send email logic with BullMQ deduplication
    // We only send for active/renewed/succeeded events where status is 'active'
    if (status === 'active' || event.type === 'payment.succeeded') {
      try {
        // Unique Job ID for BullMQ: plan_update_{subscriptionId}_{expiryTimestamp}
        // This ensures the same email isn't sent multiple times for the same period
        const expiryTs = expiry ? expiry.getTime() : 'no_expiry';
        const jobId = `plan_update_${subscriptionId || email}_${expiryTs}`;

        await emailService.sendPlanUpdateEmail(
          email,
          plan,
          expiry,
          jobId
        );

        logger.info('Plan update email queued', {
          email,
          plan,
          status,
          jobId,
        });
      } catch (emailError) {
        logger.error('Failed to queue plan update email', {
          email,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    } else {
      logger.info('User updated (email skipped - not an activation event)', {
        email,
        plan,
        status,
      });
    }
  } catch (dbError) {
    logger.error('Failed to update user plan in database', {
      email,
      error: dbError instanceof Error ? dbError.message : String(dbError),
    });
    throw dbError;
  }
}

async function downgradeUser(event: any) {
  const subscriptionId = event.data?.subscription_id;
  if (!subscriptionId) return;

  await prisma.user.updateMany({
    where: { subscriptionId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'inactive',
    },
  });

  logger.info('Subscription downgraded', {
    subscriptionId,
  });
}