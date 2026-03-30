import api from './api'

export const trainerService = {
  getProfile: () => api.get('/trainer/profile'),
  updateProfile: (data: unknown) => api.patch('/trainer/profile', data),
  getSettings: () => api.get('/trainer/settings'),
  updateSettings: (data: unknown) => api.patch('/trainer/settings', data),
  getDashboard: () => api.get('/trainer/dashboard'),
  getLatestReport: () => api.get('/trainer/reports/latest'),
}
