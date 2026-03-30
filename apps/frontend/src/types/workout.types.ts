export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
export type MuscleGroup = 'CHEST' | 'BACK' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS' | 'LEGS' | 'GLUTES' | 'CORE' | 'FULL_BODY' | 'CARDIO'
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export interface WorkoutPlan {
  id: string
  clientId: string
  name: string
  isActive: boolean
  isApproved: boolean
  days: WorkoutDay[]
  createdAt: string
}

export interface WorkoutDay {
  id: string
  planId: string
  dayOfWeek: DayOfWeek
  name: string
  isRestDay: boolean
  exercises: WorkoutExercise[]
}

export interface WorkoutExercise {
  id: string
  dayId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  muscleGroup?: MuscleGroup
  notes?: string
  mediaUrl?: string
  order: number
  isCompleted?: boolean
}

export interface ExerciseLog {
  exerciseId: string
  setsCompleted: number
  repsCompleted: string
  weightKg?: number
  notes?: string
  isPersonalRecord?: boolean
}
