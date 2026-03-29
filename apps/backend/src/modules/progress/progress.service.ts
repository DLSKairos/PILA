import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async logWeight(clientId: string, weight: number, notes?: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return this.prisma.weightCheckin.create({
      data: { clientId, weight, date: today, notes },
    })
  }

  async getWeightHistory(clientId: string) {
    return this.prisma.weightCheckin.findMany({
      where: { clientId },
      orderBy: { date: 'asc' },
    })
  }

  async getStreak(clientId: string) {
    const lastLog = await this.prisma.dailyLog.findFirst({
      where: { clientId },
      orderBy: { date: 'desc' },
    })
    const history = await this.prisma.streakHistory.findMany({
      where: { clientId },
      orderBy: { days: 'desc' },
      take: 5,
    })
    return { current: lastLog?.streakCount ?? 0, history }
  }

  async getAdherence(clientId: string) {
    return this.prisma.weeklyAdherence.findMany({
      where: { clientId },
      orderBy: { weekStart: 'desc' },
      take: 12,
    })
  }
}
