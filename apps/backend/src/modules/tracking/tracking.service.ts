import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AIService } from '../ai/ai.service'

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private ai: AIService,
  ) {}

  async getTodayLog(clientId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.prisma.dailyLog.upsert({
      where: { clientId_date: { clientId, date: today } },
      create: { clientId, date: today },
      update: {},
      include: {
        mealLogs: { include: { mealItem: true, substitution: true } },
        exerciseLogs: { include: { exercise: true } },
        waterLogs: true,
      },
    })
  }

  async completeMeal(clientId: string, mealItemId: string) {
    const log = await this.getTodayLog(clientId)
    return this.prisma.mealLog.upsert({
      where: { id: `${log.id}-${mealItemId}` },
      create: {
        dailyLogId: log.id,
        mealItemId,
        planId: (await this.prisma.mealItem.findUnique({ where: { id: mealItemId } }))!.planId,
        completed: true,
        completedAt: new Date(),
      },
      update: { completed: true, completedAt: new Date() },
    })
  }

  async substituteMeal(clientId: string, mealItemId: string, reason: string) {
    const mealItem = await this.prisma.mealItem.findUnique({ where: { id: mealItemId } })
    if (!mealItem) return null

    const existing = await this.prisma.foodSubstitution.findFirst({
      where: { originalFood: { contains: mealItem.foodName, mode: 'insensitive' } },
    })

    if (existing) {
      return {
        source: 'database',
        substituteFoodName: existing.substituteFood,
        ratio: existing.ratio,
      }
    }

    const aiSub = await this.ai.generateSubstitution(
      mealItem.foodName,
      reason,
      { calories: mealItem.calories, protein: mealItem.protein, carbs: mealItem.carbs, fat: mealItem.fat },
    )

    return { source: 'ai', ...aiSub }
  }

  async gymCheckin(clientId: string, gymId: string | undefined) {
    if (!gymId) {
      throw new BadRequestException('gymId is required')
    }

    const gym = await this.prisma.clientGym.findFirst({
      where: { id: gymId, clientId },
    })

    if (!gym) {
      throw new NotFoundException('Gym not found for this client')
    }

    const log = await this.getTodayLog(clientId)
    return this.prisma.dailyLog.update({
      where: { id: log.id },
      data: { gymCheckinAt: new Date(), gymId: gym.id },
    })
  }

  async gymCheckout(clientId: string) {
    const log = await this.getTodayLog(clientId)
    const checkinAt = log.gymCheckinAt
    const now = new Date()
    const duration = checkinAt
      ? Math.round((now.getTime() - checkinAt.getTime()) / 60000)
      : 0

    const exerciseLogs = await this.prisma.exerciseLog.findMany({
      where: { dailyLogId: log.id },
      include: { exercise: true },
    })

    const completed = exerciseLogs.filter((e) => e.completed).length

    const summary = await this.prisma.gymSessionSummary.create({
      data: {
        dailyLogId: log.id,
        date: log.date,
        duration,
        exercisesCompleted: completed,
        exercisesTotal: exerciseLogs.length,
        completionPct: exerciseLogs.length ? (completed / exerciseLogs.length) * 100 : 0,
      },
    })

    await this.prisma.dailyLog.update({
      where: { id: log.id },
      data: { gymCheckoutAt: now, sessionDuration: duration, workoutDone: completed > 0 },
    })

    return summary
  }

  async completeExercise(clientId: string, exerciseId: string, data: any) {
    const log = await this.getTodayLog(clientId)
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: { day: true },
    })

    return this.prisma.exerciseLog.create({
      data: {
        dailyLogId: log.id,
        exerciseId,
        workoutDayId: exercise!.dayId,
        setsCompleted: data.setsCompleted,
        repsCompleted: data.repsCompleted,
        weightUsed: data.weightUsed,
        completed: true,
        completedAt: new Date(),
        notes: data.notes,
      },
    })
  }

  async logWater(clientId: string) {
    const log = await this.getTodayLog(clientId)
    return this.prisma.waterLog.create({ data: { dailyLogId: log.id } })
  }

  async getWaterToday(clientId: string) {
    const log = await this.getTodayLog(clientId)
    const count = await this.prisma.waterLog.count({ where: { dailyLogId: log.id } })
    const profile = await this.prisma.trainerSettings.findFirst({
      where: { trainer: { clients: { some: { id: clientId } } } },
    })
    return { current: count, goal: profile?.defaultWaterGoal ?? 8 }
  }
}
