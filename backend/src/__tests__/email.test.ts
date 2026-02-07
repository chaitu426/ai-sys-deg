import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { EmailService } from '../utils/email-service';

// Mock BullMQ queueEmail function
jest.mock('../queue/email-queue', () => ({
    queueEmail: jest.fn(),
}));

// Mock logger
jest.mock('../utils/logger', () => ({
    getLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }),
}));

// Mock config
jest.mock('../utils/config', () => ({
    getConfig: () => ({
        RESEND_API_KEY: 'test_key',
    }),
}));

describe('Email Service Deduplication and Content', () => {
    let emailService: EmailService;
    let queueEmailMock: any;

    beforeEach(() => {
        jest.clearAllMocks();
        emailService = new EmailService();
        const { queueEmail } = require('../queue/email-queue');
        queueEmailMock = queueEmail;
    });

    it('should pass a jobId to the queue when provided', async () => {
        const options = { to: 'test@example.com', subject: 'Test', text: 'Hello' };
        const jobId = 'unique_job_id';

        await emailService.sendEmail(options, jobId);

        expect(queueEmailMock).toHaveBeenCalledWith(options, jobId);
    });

    it('should generate a rich HTML template for plan update emails', async () => {
        const email = 'user@example.com';
        const plan = 'PRO';
        const expiry = new Date('2026-01-01');
        const jobId = 'plan_update_123_456';

        await emailService.sendPlanUpdateEmail(email, plan, expiry, jobId);

        expect(queueEmailMock).toHaveBeenCalled();
        const [calledOptions, calledJobId] = queueEmailMock.mock.calls[0];

        expect(calledJobId).toBe(jobId);
        expect(calledOptions.to).toBe(email);
        expect(calledOptions.subject).toContain(plan);
        expect(calledOptions.html).toContain('Subscription Activated');
        expect(calledOptions.html).toContain(plan);
        expect(calledOptions.html).toContain('January 1, 2026');
    });

    it('should handle N/A expiry date gracefully in plan update emails', async () => {
        const email = 'user@example.com';
        const plan = 'PREMIUM';
        const jobId = 'plan_update_456_no_expiry';

        await emailService.sendPlanUpdateEmail(email, plan, undefined, jobId);

        const [calledOptions] = queueEmailMock.mock.calls[0];
        expect(calledOptions.html).toContain('N/A');
        expect(calledOptions.text).toContain('N/A');
    });
});
