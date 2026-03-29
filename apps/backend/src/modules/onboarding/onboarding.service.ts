import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AIService } from '../ai/ai.service'

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private ai: AIService,
  ) {}

  async getStatus(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { onboardingCompleted: true },
    })
    const messageCount = await this.prisma.onboardingMessage.count({ where: { clientId } })
    return { completed: client?.onboardingCompleted, turnCount: Math.floor(messageCount / 2) }
  }

  async sendMessage(clientId: string, content: string) {
    const messages = await this.prisma.onboardingMessage.findMany({
      where: { clientId },
      orderBy: { order: 'asc' },
    })

    const turnCount = Math.floor(messages.length / 2)
    if (turnCount >= 6) {
      throw new BadRequestException('Onboarding ya completado')
    }

    await this.prisma.onboardingMessage.create({
      data: { clientId, role: 'user', content, order: messages.length },
    })

    const history = [...messages, { role: 'user', content }]
    const isLast = turnCount >= 5

    const reply = await this.ai.generateOnboardingReply(history, turnCount)

    await this.prisma.onboardingMessage.create({
      data: { clientId, role: 'assistant', content: reply, order: messages.length + 1 },
    })

    if (isLast) {
      const allMessages = [...history, { role: 'assistant', content: reply }]
      const summary = await this.ai.generateMotivationSummary(allMessages)

      await this.prisma.motivationProfile.upsert({
        where: { clientId },
        create: { clientId, onboardingResponses: allMessages, ...summary },
        update: { onboardingResponses: allMessages, ...summary },
      })

      await this.prisma.client.update({
        where: { id: clientId },
        data: { onboardingCompleted: true },
      })
    }

    return { reply, completed: isLast }
  }
}
