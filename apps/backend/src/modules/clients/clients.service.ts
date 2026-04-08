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

      this.email.sendClientInvitation(
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

    this.email.sendClientInvitation(
      dto.email,
      trainer?.name ?? 'Tu entrenador',
      invitationToken,
      trainer?.preferredLanguage ?? 'es',
    ).catch(() => {})

    return { client, invitationToken }
  }

  async listClients(trainerId: string) {
    return this.prisma.client.findMany({
      where: { trainerId },
      select: {
        id: true, name: true, email: true, phone: true,
        photoUrl: true, onboardingCompleted: true, isActive: true, createdAt: true,
      },
    })
  }

  async getClient(trainerId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, trainerId },
      include: {
        profile: { include: { restrictions: true, injuries: true } },
        motivationProfile: true,
      },
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

    // Mapear campos del perfil para que coincidan con los tipos del frontend
    let mappedProfile: Record<string, unknown> | null = null
    if (client.profile) {
      const p = client.profile as any
      const age = p.birthDate
        ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
        : undefined
      mappedProfile = {
        ...p,
        age,
        proteinGrams: p.targetProtein,
        carbsGrams: p.targetCarbs,
        fatGrams: p.targetFat,
      }
    }

    // Extraer datos del perfil motivacional del onboarding
    const mp = client.motivationProfile as any
    const onboardingData: Record<string, unknown> = {}
    if (mp) {
      onboardingData.onboardingMotivation = mp.aiSummary ?? mp.mainObstacle
      onboardingData.onboardingGoal = client.profile?.goal ?? undefined
      onboardingData.onboardingActivityLevel = client.profile?.activityLevel ?? undefined
    }

    return {
      ...client,
      profile: mappedProfile,
      feedbackPending,
      unreadMessages,
      ...onboardingData,
    }
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

    // Mapa de valores del frontend → enum ActivityLevel del schema
    const ACTIVITY_MAP: Record<string, string> = {
      SEDENTARY: 'SEDENTARY',
      LIGHTLY_ACTIVE: 'LIGHT',
      LIGHT: 'LIGHT',
      MODERATELY_ACTIVE: 'MODERATE',
      MODERATE: 'MODERATE',
      VERY_ACTIVE: 'ACTIVE',
      EXTREMELY_ACTIVE: 'ACTIVE',
      ACTIVE: 'ACTIVE',
    }

    // Normalizar campos: el frontend puede enviar dateOfBirth/birthDate, gender/sex, MALE/male
    const rawBirthDate = dto.birthDate ?? dto.dateOfBirth
    const rawSex = (dto.sex ?? dto.gender ?? 'other').toString().toLowerCase()
    const sex = rawSex === 'male' ? 'male' : rawSex === 'female' ? 'female' : 'male'
    const currentWeight = dto.currentWeight != null ? parseFloat(dto.currentWeight) : undefined
    const targetWeight = dto.targetWeight != null ? parseFloat(dto.targetWeight) : undefined
    const height = dto.height != null ? parseFloat(dto.height) : undefined

    // Obtener perfil existente para rellenar campos que no vengan en el payload
    const existing = await this.prisma.clientProfile.findUnique({ where: { clientId } })

    const effectiveWeight = currentWeight ?? existing?.currentWeight ?? 70
    const effectiveHeight = height ?? existing?.height ?? 170
    const rawActivityLevel = dto.activityLevel ?? existing?.activityLevel ?? 'MODERATE'
    const effectiveActivityLevel = ACTIVITY_MAP[rawActivityLevel] ?? 'MODERATE'
    const effectiveGoal = dto.goal ?? existing?.goal ?? 'MAINTENANCE'

    let birthDate: Date = existing?.birthDate ?? new Date('2000-01-01')
    if (rawBirthDate) {
      const parsed = new Date(rawBirthDate)
      if (!isNaN(parsed.getTime())) birthDate = parsed
    }

    const age = Math.max(1, Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000)))
    const bmi = effectiveHeight > 0 ? Math.round((effectiveWeight / Math.pow(effectiveHeight / 100, 2)) * 10) / 10 : undefined

    let tdee: number | undefined = existing?.tdee ?? undefined
    let targetCalories: number | undefined = existing?.targetCalories ?? undefined
    let macros: { protein: number; carbs: number; fat: number } | undefined

    try {
      tdee = calculateTDEE({
        weight: effectiveWeight,
        height: effectiveHeight,
        age,
        sex: sex as 'male' | 'female',
        activityLevel: effectiveActivityLevel as any,
      })
      targetCalories = calculateTargetCalories(tdee, effectiveGoal)
      macros = calculateMacros({ targetCalories, goal: effectiveGoal, weight: effectiveWeight })
    } catch {
      // mantener valores existentes si el cálculo falla
    }

    const profileData: Record<string, unknown> = {
      birthDate,
      sex,
      currentWeight: effectiveWeight,
      height: effectiveHeight,
      targetWeight: targetWeight ?? existing?.targetWeight ?? 0,
      goal: effectiveGoal,
      activityLevel: effectiveActivityLevel,
      ...(bmi !== undefined && { bmi }),
      ...(tdee !== undefined && !isNaN(tdee) && { tdee }),
      ...(targetCalories !== undefined && !isNaN(targetCalories) && { targetCalories }),
      ...(macros && !isNaN(macros.protein) && {
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
      }),
      targetWeeks: dto.targetWeeks ?? existing?.targetWeeks ?? 12,
      daysPerWeek: dto.daysPerWeek ?? existing?.daysPerWeek ?? 3,
      sessionDuration: dto.sessionDuration ?? existing?.sessionDuration ?? 60,
    }

    const profile = await this.prisma.clientProfile.upsert({
      where: { clientId },
      create: { clientId, ...profileData } as any,
      update: profileData,
    })

    await this.prisma.nutritionPlan.updateMany({
      where: { clientId, isActive: true },
      data: { cacheValid: false },
    })

    return {
      ...profile,
      age: Math.floor((Date.now() - profile.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000)),
      proteinGrams: profile.targetProtein,
      carbsGrams: profile.targetCarbs,
      fatGrams: profile.targetFat,
    }
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
