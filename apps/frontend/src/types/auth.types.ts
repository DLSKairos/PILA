export type UserRole = 'TRAINER' | 'CLIENT'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  trainerId?: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}
