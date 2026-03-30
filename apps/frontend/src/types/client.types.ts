export type ClientGoal = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'ATHLETIC_PERFORMANCE' | 'GENERAL_HEALTH'
export type ActivityLevel = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface Client {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  trainerId: string
  createdAt: string
  profile?: ClientProfile
  feedbackPending?: number
}

export interface ClientProfile {
  id: string
  clientId: string
  height?: number
  currentWeight?: number
  targetWeight?: number
  age?: number
  gender?: Gender
  goal?: ClientGoal
  activityLevel?: ActivityLevel
  tdee?: number
  targetCalories?: number
  proteinGrams?: number
  carbsGrams?: number
  fatGrams?: number
}

export interface Gym {
  id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  radiusMeters: number
}
