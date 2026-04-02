import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AIService } from '../ai/ai.service'

@Injectable()
export class WorkoutService {
  constructor(
    private prisma: PrismaService,
    private ai: AIService,
  ) {}

  async getActivePlan(clientId: string) {
    return this.prisma.workoutPlan.findFirst({
      where: { clientId, isActive: true },
      include: {
        days: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: { orderBy: { order: 'asc' } },
          },
        },
      },
    })
  }

  async getPlanHistory(clientId: string) {
    return this.prisma.workoutPlan.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, version: true, isActive: true, generatedByAI: true, approvedAt: true, createdAt: true },
    })
  }

  async generateWithAI(trainerId: string, clientId: string) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { clientId },
      include: { injuries: { where: { isActive: true } } },
    })
    if (!profile) throw new NotFoundException('El cliente no tiene perfil configurado')

    const client = await this.prisma.client.findUnique({ where: { id: clientId } })

    const aiPlan = await this.ai.generateWorkoutPlan({
      name: client!.name,
      goal: profile.goal,
      daysPerWeek: profile.daysPerWeek,
      sessionDuration: profile.sessionDuration,
      activityLevel: profile.activityLevel,
      hasGymAccess: profile.hasGymAccess,
      injuries: profile.injuries.map((i) => `${i.description}${i.limitation ? ': ' + i.limitation : ''}`),
    })

    await this.prisma.workoutPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    })

    const lastPlan = await this.prisma.workoutPlan.findFirst({
      where: { clientId },
      orderBy: { version: 'desc' },
    })

    return this.prisma.workoutPlan.create({
      data: {
        clientId,
        version: (lastPlan?.version ?? 0) + 1,
        generatedByAI: true,
        cacheValid: true,
        lastGeneratedAt: new Date(),
        days: {
          create: aiPlan.days.map((day: any) => ({
            dayOfWeek: day.dayOfWeek,
            isRestDay: day.isRestDay ?? false,
            notes: day.notes,
            ...(!day.isRestDay && {
              exercises: {
                create: (day.exercises ?? []).map((ex: any, idx: number) => ({
                  order: ex.order ?? idx + 1,
                  name: ex.name,
                  muscleGroup: ex.muscleGroup,
                  sets: ex.sets,
                  reps: String(ex.reps),
                  restSeconds: ex.restSeconds,
                  weightSuggestion: typeof ex.weightSuggestion === 'number' ? ex.weightSuggestion : null,
                  notes: typeof ex.weightSuggestion === 'string'
                    ? `${ex.notes ?? ''}${ex.notes ? ' · ' : ''}Peso sugerido: ${ex.weightSuggestion}`.trim()
                    : ex.notes,
                })),
              },
            }),
          })),
        },
      },
      include: {
        days: { include: { exercises: { orderBy: { order: 'asc' } } } },
      },
    })
  }

  async createPlan(clientId: string) {
    const lastPlan = await this.prisma.workoutPlan.findFirst({
      where: { clientId },
      orderBy: { version: 'desc' },
    })

    await this.prisma.workoutPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    })

    return this.prisma.workoutPlan.create({
      data: {
        clientId,
        version: (lastPlan?.version ?? 0) + 1,
      },
      include: { days: true },
    })
  }

  async approvePlan(planId: string) {
    return this.prisma.workoutPlan.update({
      where: { id: planId },
      data: { approvedAt: new Date() },
    })
  }

  async addDay(planId: string, dto: any) {
    return this.prisma.workoutDay.create({
      data: { planId, dayOfWeek: dto.dayOfWeek, isRestDay: dto.isRestDay ?? false, notes: dto.notes },
    })
  }

  async updateDay(dayId: string, dto: any) {
    return this.prisma.workoutDay.update({ where: { id: dayId }, data: dto })
  }

  async deleteDay(dayId: string) {
    return this.prisma.workoutDay.delete({ where: { id: dayId } })
  }

  async addExercise(dayId: string, dto: any) {
    const count = await this.prisma.exercise.count({ where: { dayId } })
    return this.prisma.exercise.create({
      data: {
        dayId,
        order: dto.order ?? count + 1,
        name: dto.name,
        muscleGroup: dto.muscleGroup,
        sets: dto.sets,
        reps: String(dto.reps),
        restSeconds: dto.restSeconds,
        weightSuggestion: dto.weightSuggestion,
        weeklyProgressionKg: dto.weeklyProgressionKg,
        notes: dto.notes,
      },
    })
  }

  async updateExercise(exerciseId: string, dto: any) {
    return this.prisma.exercise.update({ where: { id: exerciseId }, data: dto })
  }

  async deleteExercise(exerciseId: string) {
    return this.prisma.exercise.delete({ where: { id: exerciseId } })
  }

  async getTodayWorkout(clientId: string) {
    const today = new Date()
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const todayName = days[today.getDay()]

    const plan = await this.getActivePlan(clientId)
    if (!plan) return null

    return plan.days.find((d) => d.dayOfWeek === todayName) ?? null
  }

  async getExerciseLibrary(muscle?: string, difficulty?: string) {
    return this.prisma.exerciseLibrary.findMany({
      where: {
        isActive: true,
        ...(muscle && { muscleGroup: { contains: muscle, mode: 'insensitive' } }),
        ...(difficulty && { difficulty: { contains: difficulty, mode: 'insensitive' } }),
      },
      take: 50,
    })
  }
}
