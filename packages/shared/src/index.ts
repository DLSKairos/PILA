// Tipos compartidos entre frontend y backend

export type UserRole = 'TRAINER' | 'CLIENT'

export type SubscriptionPlan = 'STARTER' | 'PRO' | 'ELITE'

export type ClientGoal =
  | 'LOSE_WEIGHT'
  | 'GAIN_MUSCLE'
  | 'DEFINE'
  | 'ENDURANCE'
  | 'MAINTENANCE'

export type MealType =
  | 'BREAKFAST'
  | 'MORNING_SNACK'
  | 'LUNCH'
  | 'AFTERNOON_SNACK'
  | 'DINNER'

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export type Language = 'es' | 'en'

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface LoginPayload {
  email: string
  password: string
  role: UserRole
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ClientSummary {
  id: string
  name: string
  photoUrl?: string
  goal: ClientGoal
  currentWeight: number
  targetWeight: number
  streakCount: number
  weeklyAdherence: number
  status: 'green' | 'yellow' | 'red'
}
