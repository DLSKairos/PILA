import { Injectable } from '@nestjs/common'
import { FeedbackType } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async createFeedback(clientId: string, dto: any) {
    return this.prisma.clientFeedback.create({ data: { clientId, ...dto } })
  }

  async getClientFeedback(clientId: string, resolved?: string, type?: string) {
    const resolvedFilter: boolean | undefined =
      resolved === 'true' ? true : resolved === 'false' ? false : undefined

    const typeFilter: FeedbackType | undefined =
      type && Object.values(FeedbackType).includes(type as FeedbackType)
        ? (type as FeedbackType)
        : undefined

    return this.prisma.clientFeedback.findMany({
      where: {
        clientId,
        ...(resolvedFilter !== undefined ? { resolved: resolvedFilter } : {}),
        ...(typeFilter !== undefined ? { type: typeFilter } : {}),
      },
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
