export const PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACTIVATE: '/activate',
  INSTALL: '/install',
  SUBSCRIPTION_EXPIRED: '/subscription-expired',

  TRAINER: {
    DASHBOARD: '/trainer/dashboard',
    CLIENTS: '/trainer/clients',
    CLIENT_DETAIL: (id: string) => `/trainer/clients/${id}`,
    NEW_CLIENT: '/trainer/clients/new',
    NUTRITION_PLAN: (id: string) => `/trainer/clients/${id}/nutrition`,
    WORKOUT_PLAN: (id: string) => `/trainer/clients/${id}/workout`,
    REPORTS: '/trainer/reports',
    SUBSCRIPTION: '/trainer/subscription',
    SETTINGS: '/trainer/settings',
  },

  CLIENT: {
    HOME: '/client/home',
    ONBOARDING: '/client/onboarding',
    NUTRITION: '/client/nutrition',
    GYM: '/client/gym',
    PROGRESS: '/client/progress',
    CHAT: '/client/chat',
    SETTINGS: '/client/settings',
  },
}
