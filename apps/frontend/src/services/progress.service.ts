import api from './api'

export const progressService = {
  logWeight: (weightKg: number, notes?: string) =>
    api.post('/client/progress/weight', { weight: weightKg, notes }),
  getWeightHistory: () => api.get('/client/progress/weight'),
  getStreak: () => api.get('/client/progress/streak'),
  getAdherence: () => api.get('/client/progress/adherence'),
  uploadPhoto: (formData: FormData) =>
    api.post('/client/progress/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPhotos: () => api.get('/client/progress/photos'),
}
