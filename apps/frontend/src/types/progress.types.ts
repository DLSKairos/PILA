export interface WeightCheckin {
  id: string
  clientId: string
  weightKg: number
  date: string
  notes?: string
  photoUrl?: string
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string
  isActive: boolean
}

export interface AdherenceData {
  weeklyAdherence: number
  monthlyAdherence: number
  daysTracked: number
  totalDays: number
}
