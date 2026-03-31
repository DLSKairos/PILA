import { create } from 'zustand'
import type { DailyLog, ExerciseLogData } from '@/types/tracking.types'

interface TrackingStore {
  today: DailyLog | null
  mealCompletions: Record<string, boolean>
  waterCount: number
  waterGoal: number
  pendingSubstitution: string | null
  substitutionAttempts: number
  gymSessionActive: boolean
  gymSessionStart: Date | null
  gymSessionDuration: number
  currentExerciseIndex: number
  voiceModeActive: boolean
  streakCount: number
  streakActive: boolean

  setToday: (log: DailyLog) => void
  completeMeal: (mealItemId: string) => void
  uncompleteMeal: (mealItemId: string) => void
  addWater: () => void
  startGymSession: (gymId: string) => void
  endGymSession: () => void
  completeExercise: (exerciseId: string, data: ExerciseLogData) => void
  toggleVoiceMode: () => void
  requestSubstitution: (mealItemId: string) => void
  clearSubstitution: () => void
  setStreak: (count: number, active: boolean) => void
}

export const useTrackingStore = create<TrackingStore>((set) => ({
  today: null,
  mealCompletions: {},
  waterCount: 0,
  waterGoal: 8,
  pendingSubstitution: null,
  substitutionAttempts: 0,
  gymSessionActive: false,
  gymSessionStart: null,
  gymSessionDuration: 0,
  currentExerciseIndex: 0,
  voiceModeActive: false,
  streakCount: 0,
  streakActive: false,

  setToday: (today) =>
    set({
      today,
      waterCount: today.waterCount ?? 0,
      waterGoal: today.waterGoal ?? 0,
      mealCompletions: Object.fromEntries(
        (today.mealCompletions ?? []).map((mc) => [mc.mealItemId, true])
      ),
      streakCount: today.streakCount ?? 0,
    }),

  completeMeal: (mealItemId) =>
    set((s) => ({ mealCompletions: { ...s.mealCompletions, [mealItemId]: true } })),

  uncompleteMeal: (mealItemId) =>
    set((s) => {
      const next = { ...s.mealCompletions }
      delete next[mealItemId]
      return { mealCompletions: next }
    }),

  addWater: () => set((s) => ({ waterCount: Math.min(s.waterCount + 1, s.waterGoal) })),

  startGymSession: (_gymId) =>
    set({ gymSessionActive: true, gymSessionStart: new Date(), gymSessionDuration: 0 }),

  endGymSession: () =>
    set({ gymSessionActive: false, gymSessionStart: null, gymSessionDuration: 0, currentExerciseIndex: 0 }),

  completeExercise: (_exerciseId, _data) =>
    set((s) => ({ currentExerciseIndex: s.currentExerciseIndex + 1 })),

  toggleVoiceMode: () => set((s) => ({ voiceModeActive: !s.voiceModeActive })),

  requestSubstitution: (mealItemId) =>
    set((s) => ({
      pendingSubstitution: mealItemId,
      substitutionAttempts: s.substitutionAttempts + 1,
    })),

  clearSubstitution: () => set({ pendingSubstitution: null, substitutionAttempts: 0 }),

  setStreak: (streakCount, streakActive) => set({ streakCount, streakActive }),
}))

