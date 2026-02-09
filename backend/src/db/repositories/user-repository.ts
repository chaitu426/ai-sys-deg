/**
 * User repository
 * Data access layer for users and authentication
 */

import { prisma } from '../client';
import { getLogger } from '../../utils/logger';
import * as bcrypt from 'bcryptjs';

const logger = getLogger();

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class UserRepository {
  async createUser(input: CreateUserInput) {
    logger.debug('Creating user', { email: input.email });

    // Hash password with 12 rounds (2026 security standard)
    const hashedPassword = await bcrypt.hash(input.password, 12);

    return prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
        // Don't return password
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isVerified: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        githubId: true,
        githubAccessToken: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    });
  }

  async verifyUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  async createOtp(userId: string, code: string, type: 'signup' | 'reset_password' = 'signup') {
    // Expire in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    return prisma.otp.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });
  }

  async findValidOtp(userId: string, code: string, type: string) {
    return prisma.otp.findFirst({
      where: {
        userId,
        code,
        type,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async invalidateOtps(userId: string, type: string) {
    return prisma.otp.deleteMany({
      where: {
        userId,
        type,
      },
    });
  }

  async verifyPassword(user: { password: string }, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.password);
  }

  async getUserProjects(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: {
          designVersions: {
            orderBy: { version: 'desc' },
            take: 1, // Latest version
            include: {
              agentOutputs: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where: { userId } }),
    ]);

    return { projects, total, page, limit, pages: Math.ceil(total / limit) };
  }
  async verifyUserWithOtp(userId: string, type: string) {
    return prisma.$transaction(async (tx) => {
      // Mark verified
      const user = await tx.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });

      // Invalidate all OTPs of this type for this user
      await tx.otp.deleteMany({
        where: {
          userId,
          type,
        },
      });

      return user;
    });
  }
}

export const userRepository = new UserRepository();
