import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { EmailService } from '../email/email.service'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { calculateTDEE } from '../../common/utils/tdee.calculator'
import { calculateMacros, calculateTargetCalories } from '../../common/utils/macros.calculator'
import { hashClientProfile } from '../../common/utils/hash.util'

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
    private email: EmailService,
  ) {}

  async createClient(trainerId: string, dto: any) {
    await this.subscriptions.checkClientLimit(trainerId)

    const name = dto.name ?? (dto.firstName && dto.lastName ? `${dto.firstName} ${dto.lastName}` : dto.firstName ?? dto.lastName ?? '')

    // Check if a soft-deleted client with this email already belongs to this trainer.
    // In that case reactivate instead of creating a duplicate row (which would violate
    // the unique constraint on email).
    const existing = await this.prisma.client.findUnique({
      where: { email: dto.email },
    })

    if (existing) {
      if (existing.trainerId !== trainerId || existing.isActive) {
        // Email belongs to a different trainer, or the client is already active.
        throw new ConflictException('Este email ya está registrado como cliente')
      }

      // Reactivate the soft-deleted client for the same trainer.
      const tempPassword = randomBytes(8).toString('hex')
      const passwordHash = await bcrypt.hash(tempPassword, 12)
      const invitationToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const client = await this.prisma.client.update({
        where: { id: existing.id },
        data: {
          name,
          passwordHash,
          phone: dto.phone ?? existing.phone,
          isActive: true,
          onboardingCompleted: false,
        },
      })

      await this.prisma.clientInvitation.create({
        data: { email: dto.email, token: invitationToken, expiresAt, trainerId },
      })

      const trainer = await this.prisma.trainer.findUnique({
        where: { id: trainerId },
        select: { name: true, preferredLanguage: true },
      })

      await this.email.sendClientInvitation(
        dto.email,
        trainer?.name ?? 'Tu entrenador',
        invitationToken,
        trainer?.preferredLanguage ?? 'es',
      )

      return { client, invitationToken }
    }

    // No existing record — proceed with normal creation.
    const tempPassword = randomBytes(8).toString('hex')
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    const invitationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    let client: Awaited<ReturnType<typeof this.prisma.client.create>>
    try {
      client = await this.prisma.client.create({
        data: {
          name,
          email: dto.email,
          passwordHash,
          phone: dto.phone,
          trainerId,
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Este email ya está registrado como cliente')
      }
      throw err
    }

    await this.prisma.clientInvitation.create({
      data: { email: dto.email, token: invitationToken, expiresAt, trainerId },
    })

    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
      select: { name: true, preferredLanguage: true },
    })

    await this.email.sendClientInvitation(
      dto.email,
      trainer?.name ?? 'Tu entrenador',
      invitationToken,
      trainer?.preferredLanguage ?? 'es',
    )

    return { client, invitationToken }
  }

  async listClients(trainerId: string) {
    return this.prisma.client.findMany({
      where: { trainerId, isActive: true },
      select: {
        id: true, name: true, email: true, phone: true,
        photoUrl: true, onboardingCompleted: true, isActive: true, createdAt: true,
      },
    })
  }

  async getClient(trainerId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, trainerId },
      include: { profile: { include: { restrictions: true, injuries: true } } },
    })
    if (!client) throw new NotFoundException('Cliente no encontrado')

    const [feedbackPending, unreadMessages] = await Promise.all([
      this.prisma.clientFeedback.count({
        where: { clientId, resolved: false },
      }),
      this.prisma.message.count({
        where: { clientId, senderRole: 'CLIENT', readAt: null },
      }),
    ])

    return { ...client, feedbackPending, unreadMessages }
  }

  async updateClient(trainerId: string, clientId: string, dto: any) {
    await this.getClient(trainerId, clientId)
    return this.prisma.client.update({ where: { id: clientId }, data: dto })
  }

  async deactivateClient(trainerId: string, clientId: string) {
    await this.getClient(trainerId, clientId)
    return this.prisma.client.update({
      where: { id: clientId },
      data: { isActive: false },
    })
  }

  async createOrUpdateProfile(trainerId: string, clientId: string, dto: any) {
    await this.getClient(trainerId, clientId)

    const birthDate = new Date(dto.birthDate)
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000))
    const bmi = dto.weight / Math.pow(dto.height / 100, 2)

    const tdee = calculateTDEE({
      weight: dto.currentWeight,
      height: dto.height,
      age,
      sex: dto.sex,
      activityLevel: dto.activityLevel,
    })

    const targetCalories = calculateTargetCalories(tdee, dto.goal)
    const macros = calculateMacros({ targetCalories, goal: dto.goal, weight: dto.currentWeight })

    const profileData = {
      ...dto,
      birthDate,
      bmi: Math.round(bmi * 10) / 10,
      tdee,
      targetCalories,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFat: macros.fat,
    }

    const profile = await this.prisma.clientProfile.upsert({
      where: { clientId },
      create: { clientId, ...profileData },
      update: profileData,
    })

    const hash = hashClientProfile(profileData)
    await this.prisma.nutritionPlan.updateMany({
      where: { clientId, isActive: true },
      data: { cacheValid: false },
    })

    return profile
  }

  async addGym(trainerId: string, clientId: string, dto: any) {
    await this.getClient(trainerId, clientId)
    return this.prisma.clientGym.create({ data: { clientId, ...dto } })
  }

  async getGyms(trainerId: string, clientId: string) {
    await this.getClient(trainerId, clientId)
    return this.prisma.clientGym.findMany({ where: { clientId, isActive: true } })
  }

  async addRestriction(trainerId: string, clientId: string, dto: any) {
    const client = await this.getClient(trainerId, clientId)
    return this.prisma.clientRestriction.create({
      data: { profileId: client.profile!.id, ...dto },
    })
  }

  async addInjury(trainerId: string, clientId: string, dto: any) {
    const client = await this.getClient(trainerId, clientId)
    return this.prisma.clientInjury.create({
      data: { profileId: client.profile!.id, ...dto },
    })
  }
}
