import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(trainerId: string, clientId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit
    return this.prisma.message.findMany({
      where: { trainerId, clientId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
  }

  async saveMessage(data: {
    trainerId: string
    clientId: string
    content: string
    senderRole: 'TRAINER' | 'CLIENT'
    attachmentUrl?: string
    attachmentType?: string
  }) {
    return this.prisma.message.create({ data })
  }

  async markAsRead(trainerId: string, clientId: string, readerRole: 'TRAINER' | 'CLIENT') {
    const senderRole = readerRole === 'TRAINER' ? 'CLIENT' : 'TRAINER'
    return this.prisma.message.updateMany({
      where: { trainerId, clientId, senderRole, readAt: null },
      data: { readAt: new Date() },
    })
  }

  async getUnreadCount(userId: string, role: 'TRAINER' | 'CLIENT') {
    if (role === 'TRAINER') {
      return this.prisma.message.count({
        where: { trainerId: userId, senderRole: 'CLIENT', readAt: null },
      })
    }
    return this.prisma.message.count({
      where: { clientId: userId, senderRole: 'TRAINER', readAt: null },
    })
  }
}
