import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PLAN_LIMITS } from '../../common/guards/plan-limits.guard'

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(trainerId: string) {
    return this.prisma.trainerSubscription.findUnique({
      where: { trainerId },
    })
  }

  async getUsage(trainerId: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [clientCount, aiUsage, sub] = await Promise.all([
      this.prisma.client.count({ where: { trainerId, isActive: true } }),
      this.prisma.aIRateLimit.findMany({
        where: { trainerId, periodStart: { gte: startOfMonth } },
      }),
      this.prisma.trainerSubscription.findUnique({ where: { trainerId } }),
    ])

    const plan = sub?.plan ?? 'STARTER'
    const limits = PLAN_LIMITS[plan]

    return {
      plan,
      status: sub?.status,
      clients: { current: clientCount, max: limits.maxClients },
      aiPlans: {
        used: aiUsage.reduce((s, r) => s + r.count, 0),
        max: limits.aiPlansPerMonth,
      },
    }
  }

  async checkClientLimit(trainerId: string): Promise<void> {
    const sub = await this.prisma.trainerSubscription.findUnique({
      where: { trainerId },
    })
    const plan = sub?.plan ?? 'STARTER'
    const max = PLAN_LIMITS[plan].maxClients

    const count = await this.prisma.client.count({
      where: { trainerId, isActive: true },
    })
    if (count >= max) {
      throw new ForbiddenException(
        `Has alcanzado el límite de ${max} clientes en tu plan ${plan}. Actualiza tu plan para agregar más.`,
      )
    }
  }

  async registerPayment(trainerId: string, dto: any) {
    return this.prisma.paymentIntent.create({
      data: {
        trainerId,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        status: 'pending',
        method: 'manual',
        reference: dto.reference,
        planName: dto.planName,
      },
    })
  }
}
