import { create } from 'zustand'
import type { Client, ClientProfile } from '@/types/client.types'
import type { NutritionPlan } from '@/types/nutrition.types'
import type { WorkoutPlan } from '@/types/workout.types'

interface ClientStore {
  profile: (Client & { profile?: ClientProfile }) | null
  nutritionPlan: NutritionPlan | null
  workoutPlan: WorkoutPlan | null
  setProfile: (profile: Client & { profile?: ClientProfile }) => void
  setNutritionPlan: (plan: NutritionPlan) => void
  setWorkoutPlan: (plan: WorkoutPlan) => void
  clear: () => void
}

export const useClientStore = create<ClientStore>((set) => ({
  profile: null,
  nutritionPlan: null,
  workoutPlan: null,
  setProfile: (profile) => set({ profile }),
  setNutritionPlan: (nutritionPlan) => set({ nutritionPlan }),
  setWorkoutPlan: (workoutPlan) => set({ workoutPlan }),
  clear: () => set({ profile: null, nutritionPlan: null, workoutPlan: null }),
}))
