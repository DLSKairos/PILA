import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PLAN_LIMITS } from '../../common/guards/plan-limits.guard'

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  async checkFeature(trainerId: string, feature: string): Promise<boolean> {
    const [flag, override, sub] = await Promise.all([
      this.prisma.featureFlag.findUnique({ where: { key: feature } }),
      this.prisma.featureFlagOverride.findFirst({
        where: { trainerId, flag: { key: feature } },
      }),
      this.prisma.trainerSubscription.findUnique({ where: { trainerId } }),
    ])

    if (override) return override.isEnabled
    if (flag && flag.isEnabled) return true

    const plan = sub?.plan ?? 'STARTER'
    const limits = PLAN_LIMITS[plan] as any
    return limits?.[feature] ?? false
  }
}
