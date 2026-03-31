import api from './api'

export const authService = {
  loginTrainer: (email: string, password: string) =>
    api.post('/auth/trainer/login', { email, password }),

  loginClient: (email: string, password: string) =>
    api.post('/auth/client/login', { email, password }),

  registerTrainer: (data: { firstName: string; lastName: string; email: string; phone?: string; password: string }) =>
    api.post('/auth/trainer/register', data),

  refresh: () =>
    api.post('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  forgotPassword: (email: string, role: 'TRAINER' | 'CLIENT') =>
    api.post('/auth/forgot-password', { email, role }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),

  acceptTerms: () =>
    api.post('/auth/accept-terms'),

  getSessions: () =>
    api.get('/auth/sessions'),

  closeSession: (tokenId: string) =>
    api.delete(`/auth/sessions/${tokenId}`),

  activateClient: (token: string, password: string) =>
    api.post('/auth/client/activate', { token, password }),
}
