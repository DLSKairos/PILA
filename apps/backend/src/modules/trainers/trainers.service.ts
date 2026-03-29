import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(trainerId: string) {
    return this.prisma.trainer.findUnique({
      where: { id: trainerId },
      select: {
        id: true, name: true, email: true, phone: true,
        photoUrl: true, bio: true, specialties: true,
        preferredLanguage: true, createdAt: true,
      },
    })
  }

  async updateProfile(trainerId: string, dto: any) {
    return this.prisma.trainer.update({
      where: { id: trainerId },
      data: dto,
      select: {
        id: true, name: true, email: true, phone: true,
        photoUrl: true, bio: true, specialties: true,
        preferredLanguage: true,
      },
    })
  }

  async getSettings(trainerId: string) {
    return this.prisma.trainerSettings.findUnique({ where: { trainerId } })
  }

  async updateSettings(trainerId: string, dto: any) {
    return this.prisma.trainerSettings.upsert({
      where: { trainerId },
      create: { trainerId, ...dto },
      update: dto,
    })
  }

  async getDashboard(trainerId: string) {
    const clients = await this.prisma.client.findMany({
      where: { trainerId, isActive: true },
      include: {
        weeklyAdherence: { orderBy: { weekStart: 'desc' }, take: 1 },
        dailyLogs: { orderBy: { date: 'desc' }, take: 3 },
      },
    })

    return clients.map((c) => {
      const adherence = c.weeklyAdherence[0]?.overallAdherence ?? 0
      const lastLog = c.dailyLogs[0]
      const daysSinceLog = lastLog
        ? Math.floor((Date.now() - lastLog.date.getTime()) / 86400000)
        : 99

      let status: 'green' | 'yellow' | 'red' = 'green'
      if (adherence < 40 || daysSinceLog >= 3) status = 'red'
      else if (adherence < 70) status = 'yellow'

      return {
        id: c.id, name: c.name, photoUrl: c.photoUrl,
        weeklyAdherence: Math.round(adherence),
        daysSinceLog,
        status,
      }
    })
  }

  async getDashboardStats(trainerId: string) {
    const [totalClients, recentAdherence] = await Promise.all([
      this.prisma.client.count({ where: { trainerId, isActive: true } }),
      this.prisma.weeklyAdherence.findMany({
        where: { client: { trainerId } },
        orderBy: { weekStart: 'desc' },
        take: 50,
      }),
    ])

    const avg = recentAdherence.length
      ? recentAdherence.reduce((s, a) => s + a.overallAdherence, 0) / recentAdherence.length
      : 0

    return {
      totalClients,
      averageAdherence: Math.round(avg),
    }
  }
}
