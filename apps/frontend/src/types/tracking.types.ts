export interface DailyLog {
  id: string
  clientId: string
  date: string
  mealCompletions: MealCompletion[]
  exerciseLogs: ExerciseCompletion[]
  waterCount: number
  waterGoal: number
  gymSession?: GymSession
  streakCount: number
  adherenceScore?: number
}

export interface MealCompletion {
  mealItemId: string
  completedAt: string
  wasSubstituted: boolean
}

export interface ExerciseCompletion {
  exerciseId: string
  setsCompleted: number
  repsCompleted: string
  weightKg?: number
  completedAt: string
  isPersonalRecord: boolean
}

export interface GymSession {
  id: string
  startTime: string
  endTime?: string
  durationMinutes?: number
  gymId?: string
  checkInMethod: 'MANUAL' | 'GEOLOCATION'
}

export interface ExerciseLogData {
  setsCompleted: number
  repsCompleted: string
  weightKg?: number
  notes?: string
}
