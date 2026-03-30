import { create } from 'zustand'

type UserRole = 'TRAINER' | 'CLIENT'

interface AuthStore {
  accessToken: string | null
  role: UserRole | null
  userId: string | null
  email: string | null
  isAuthenticated: boolean
  login: (accessToken: string, role: UserRole, userId: string, email: string) => void
  logout: () => void
  setAccessToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  role: null,
  userId: null,
  email: null,
  isAuthenticated: false,

  login: (accessToken, role, userId, email) =>
    set({ accessToken, role, userId, email, isAuthenticated: true }),

  logout: () =>
    set({ accessToken: null, role: null, userId: null, email: null, isAuthenticated: false }),

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: true }),
}))
