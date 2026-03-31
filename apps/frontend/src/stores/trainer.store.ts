import { create } from 'zustand'

interface TrainerProfile {
  id: string
  email: string
  name: string
  phone?: string
  bio?: string
  photoUrl?: string
  specialties?: string[]
  preferredLanguage?: string
}

interface Subscription {
  id: string
  plan: 'STARTER' | 'PRO' | 'ELITE'
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  trialEndsAt?: string
  currentPeriodEnd?: string
  clientsCount: number
  clientsLimit: number
  aiPlansUsed: number
  aiPlansLimit: number
}

interface DashboardStats {
  totalClients: number
  activeClients: number
  avgAdherence: number
  pendingAlerts: number
  aiCostThisWeek: number
  topPerformer?: { clientId: string; name: string; adherence: number }
  needsAttention?: Array<{ clientId: string; name: string; adherence: number; daysMissed: number }>
}

interface TrainerStore {
  profile: TrainerProfile | null
  subscription: Subscription | null
  dashboardStats: DashboardStats | null
  setProfile: (profile: TrainerProfile) => void
  setSubscription: (subscription: Subscription) => void
  setDashboardStats: (stats: DashboardStats) => void
  clear: () => void
}

export const useTrainerStore = create<TrainerStore>((set) => ({
  profile: null,
  subscription: null,
  dashboardStats: null,
  setProfile: (profile) => set({ profile }),
  setSubscription: (subscription) => set({ subscription }),
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  clear: () => set({ profile: null, subscription: null, dashboardStats: null }),
}))
