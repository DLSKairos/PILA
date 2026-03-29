import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
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
  ) {}

  async createClient(trainerId: string, dto: any) {
    await this.subscriptions.checkClientLimit(trainerId)

    const tempPassword = randomBytes(8).toString('hex')
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    const invitationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const client = await this.prisma.client.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        trainerId,
      },
    })

    await this.prisma.clientInvitation.create({
      data: { email: dto.email, token: invitationToken, expiresAt, trainerId },
    })

    return { client, invitationToken }
  }

  async listClients(trainerId: string) {
    return this.prisma.client.findMany({
      where: { trainerId, isActive: true },
      select: {
        id: true, name: true, email: true, phone: true,
        photoUrl: true, onboardingCompleted: true, createdAt: true,
      },
    })
  }

  async getClient(trainerId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, trainerId },
      include: { profile: { include: { restrictions: true, injuries: true } } },
    })
    if (!client) throw new NotFoundException('Cliente no encontrado')
    return client
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
