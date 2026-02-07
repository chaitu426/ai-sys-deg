import { getLogger } from './logger';
import { Resend } from 'resend';
import { getConfig } from './config';

const logger = getLogger();

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string = 'SysDesigner <onboarding@resend.dev>'; // Default Resend testing email

  constructor() {
    const config = getConfig();
    if (config.RESEND_API_KEY) {
      this.resend = new Resend(config.RESEND_API_KEY);
    } else {
      logger.warn('RESEND_API_KEY not found. Email service will run in mock mode.');
    }
  }

  /**
   * Send an email by adding it to the queue
   * This makes the call non-blocking for the main server
   */
  async sendEmail(options: EmailOptions, jobId?: string): Promise<boolean> {
    try {
      // Import dynamically to avoid circular dependencies if any
      const { queueEmail } = require('../queue/email-queue');
      await queueEmail(options, jobId);
      return true;
    } catch (error) {
      logger.error('Failed to queue email', error);
      // Fallback to sync send if queue fails? No, better to let queue handle retries
      return false;
    }
  }

  /**
   * Process an email job from the queue
   * This is called by the BullMQ worker
   */
  async processQueueJob(options: EmailOptions): Promise<void> {
    logger.info('Processing email job', { to: options.to, subject: options.subject });

    if (!this.resend) {
      // Mock mode
      console.log('\n--- EMAIL SENT (MOCK) ---');
      console.log(`TO: ${options.to}`);
      console.log(`SUBJECT: ${options.subject}`);
      console.log(`BODY: ${options.text}`);
      console.log('-------------------------\n');
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (error) {
        logger.error('Resend API error', error);
        throw new Error(`Resend error: ${error.message}`);
      }

      logger.info('Email sent successfully via Resend', { id: data?.id });
    } catch (error) {
      logger.error('Failed to send email via Resend', error);
      throw error; // Throwing will trigger BullMQ retry
    }
  }

  /**
   * Send OTP Verification Email
   */
  async sendVerificationEmail(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Verify your SysDesigner account',
      text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Verify your account</h2>
        <p>Your verification code is:</p>
        <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>`,
    });
  }

  /**
   * Send Plan Purchase/Renewal Email
   */
  async sendPlanUpdateEmail(
    email: string,
    plan: string,
    expiry?: Date,
    jobId?: string
  ): Promise<boolean> {
    const dateStr = expiry ? expiry.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';

    const subject = `Your ${plan} Plan is Active!`;
    const text = `Success! Your ${plan} plan is now active. It will renew/expire on ${dateStr}.`;

    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1a202c;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4a5568; margin-bottom: 10px;">SysDesigner</h1>
          <div style="height: 4px; width: 60px; background: #4299e1; margin: 0 auto; border-radius: 2px;"></div>
        </div>
        
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px; text-align: center;">Subscription Activated</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          Great news! Your <strong>${plan}</strong> plan is now active and ready to use. 
          You now have access to all the premium features of your chosen plan.
        </p>
        
        <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Plan Name</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2d3748;">${plan}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Next Renewal/Expiry</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2d3748;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Status</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #38a169;">Active</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 35px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard" 
             style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 40px 0;">
        
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          If you have any questions, feel free to reply to this email.<br>
          SysDesigner Team
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html,
    }, jobId);
  }
}

export const emailService = new EmailService();
