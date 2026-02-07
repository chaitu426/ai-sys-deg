import { describe, expect, it } from '@jest/globals';
import { resolveUserPlan, Plan } from '../utils/plans';

describe('Plan Resolution Logic', () => {
    it('should return FREE for a free user without expiry', () => {
        const user = { plan: Plan.FREE, currentPeriodEnd: null };
        expect(resolveUserPlan(user)).toBe(Plan.FREE);
    });

    it('should return PRO for a pro user with a future expiry date', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const user = { plan: Plan.PRO, currentPeriodEnd: futureDate };
        expect(resolveUserPlan(user)).toBe(Plan.PRO);
    });

    it('should return FREE for a pro user with a past expiry date', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const user = { plan: Plan.PRO, currentPeriodEnd: pastDate };
        expect(resolveUserPlan(user)).toBe(Plan.FREE);
    });

    it('should return PREMIUM for a premium user with a future expiry date', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const user = { plan: Plan.PREMIUM, currentPeriodEnd: futureDate };
        expect(resolveUserPlan(user)).toBe(Plan.PREMIUM);
    });

    it('should return FREE for a premium user with a past expiry date', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const user = { plan: Plan.PREMIUM, currentPeriodEnd: pastDate };
        expect(resolveUserPlan(user)).toBe(Plan.FREE);
    });

    it('should default to FREE if plan is missing or invalid', () => {
        const user = { plan: 'REALLY_EXPENSIVE_PLAN' as any, currentPeriodEnd: null };
        expect(resolveUserPlan(user)).toBe(Plan.FREE);
    });

    it('should handle string dates correctly if passed from DB', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const user = { plan: Plan.PRO, currentPeriodEnd: futureDate.toISOString() as any };
        expect(resolveUserPlan(user)).toBe(Plan.PRO);
    });
});
