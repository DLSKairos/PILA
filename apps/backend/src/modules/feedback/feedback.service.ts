import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async createFeedback(clientId: string, dto: any) {
    return this.prisma.clientFeedback.create({ data: { clientId, ...dto } })
  }

  async getClientFeedback(clientId: string) {
    return this.prisma.clientFeedback.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async resolveFeedback(feedbackId: string, trainerNote: string) {
    return this.prisma.clientFeedback.update({
      where: { id: feedbackId },
      data: { resolved: true, resolvedAt: new Date(), trainerNote },
    })
  }
}
