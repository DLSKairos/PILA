export type MealType = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER' | 'POST_WORKOUT'

export interface NutritionPlan {
  id: string
  clientId: string
  name: string
  isActive: boolean
  isApproved: boolean
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  meals: Meal[]
  createdAt: string
}

export interface Meal {
  id: string
  planId: string
  mealType: MealType
  name: string
  scheduledTime?: string
  items: MealItem[]
}

export interface MealItem {
  id: string
  mealId: string
  foodName: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  isCompleted?: boolean
}
