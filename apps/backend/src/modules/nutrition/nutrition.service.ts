import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AIService } from '../ai/ai.service'

const MEAL_TYPE_MAP: Record<string, string> = {
  // Español
  'Desayuno': 'BREAKFAST',
  'Media mañana': 'MORNING_SNACK',
  'Merienda mañana': 'MORNING_SNACK',
  'Almuerzo': 'LUNCH',
  'Merienda': 'AFTERNOON_SNACK',
  'Merienda tarde': 'AFTERNOON_SNACK',
  'Cena': 'DINNER',
  // Inglés capitalizado
  'Breakfast': 'BREAKFAST',
  'Morning Snack': 'MORNING_SNACK',
  'Lunch': 'LUNCH',
  'Afternoon Snack': 'AFTERNOON_SNACK',
  'Dinner': 'DINNER',
  'Snack': 'AFTERNOON_SNACK',
}

@Injectable()
export class NutritionService {
  constructor(
    private prisma: PrismaService,
    private ai: AIService,
  ) {}

  async createPlan(clientId: string, dto: any) {
    await this.prisma.nutritionPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    })
    return this.prisma.nutritionPlan.create({
      data: {
        clientId,
        notes: dto.name ?? dto.notes ?? null,
        isActive: true,
      },
      include: { meals: true },
    })
  }

  async getActivePlan(clientId: string) {
    return this.prisma.nutritionPlan.findFirst({
      where: { clientId, isActive: true },
      include: { meals: { orderBy: [{ mealType: 'asc' }, { order: 'asc' }] } },
    })
  }

  async generateWithAI(trainerId: string, clientId: string) {
    const [profile, restrictions] = await Promise.all([
      this.prisma.clientProfile.findUnique({
        where: { clientId },
        include: { restrictions: true },
      }),
      this.prisma.clientFeedback.findMany({
        where: { clientId, resolved: false, type: { in: ['FOOD_DISLIKED', 'FOOD_UNAVAILABLE'] } },
      }),
    ])

    if (!profile) throw new NotFoundException('El cliente no tiene perfil configurado')

    const client = await this.prisma.client.findUnique({ where: { id: clientId } })

    const aiPlan = await this.ai.generateNutritionPlan({
      name: client!.name,
      goal: profile.goal,
      targetCalories: profile.targetCalories!,
      targetProtein: profile.targetProtein!,
      targetCarbs: profile.targetCarbs!,
      targetFat: profile.targetFat!,
      mealsPerDay: profile.mealsPerDay,
      restrictions: profile.restrictions.map((r) => r.description),
      dietaryStyle: profile.dietaryStyle ?? undefined,
    })

    await this.prisma.nutritionPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    })

    return this.prisma.nutritionPlan.create({
      data: {
        clientId,
        generatedByAI: true,
        cacheValid: true,
        lastGeneratedAt: new Date(),
        meals: {
          create: aiPlan.meals.map((meal: any, idx: number) => ({
            mealType: MEAL_TYPE_MAP[meal.mealType] ?? meal.mealType,
            order: meal.order ?? idx + 1,
            foodName: meal.foodName,
            quantity: meal.quantity,
            unit: meal.unit ?? 'g',
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            recipe: meal.recipe ?? null,
          })),
        },
      },
      include: { meals: true },
    })
  }

  async approvePlan(planId: string) {
    return this.prisma.nutritionPlan.update({
      where: { id: planId },
      data: { approvedAt: new Date() },
    })
  }

  async addMealItem(planId: string, dto: any) {
    return this.prisma.mealItem.create({ data: { planId, ...dto } })
  }

  async updateMealItem(mealId: string, dto: any) {
    return this.prisma.mealItem.update({ where: { id: mealId }, data: dto })
  }

  async deleteMealItem(mealId: string) {
    return this.prisma.mealItem.delete({ where: { id: mealId } })
  }

  async searchFoods(query: string) {
    return this.prisma.food.findMany({
      where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
      take: 20,
    })
  }

  async getFoodSubstitutions(foodName: string) {
    return this.prisma.foodSubstitution.findMany({
      where: { originalFood: { contains: foodName, mode: 'insensitive' } },
    })
  }
}
