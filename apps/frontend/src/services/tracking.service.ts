import api from './api'

export const trackingService = {
  getToday: () => api.get('/client/tracking/today'),
  completeMeal: (mealItemId: string) => api.post(`/client/tracking/meals/${mealItemId}/complete`),
  uncompleteMeal: (mealItemId: string) => api.delete(`/client/tracking/meals/${mealItemId}/complete`),
  substituteFood: (mealItemId: string, reason?: string) =>
    api.post(`/client/tracking/meals/${mealItemId}/substitute`, { reason }),
  gymCheckin: (gymId: string) => api.post('/client/tracking/gym/checkin', { gymId }),
  gymCheckout: () => api.post('/client/tracking/gym/checkout'),
  completeExercise: (exerciseId: string, data: unknown) =>
    api.post(`/client/tracking/exercises/${exerciseId}/complete`, data),
  uncompleteExercise: (exerciseId: string) =>
    api.delete(`/client/tracking/exercises/${exerciseId}/complete`),
  addWater: () => api.post('/client/tracking/water'),
  getWaterToday: () => api.get('/client/tracking/water/today'),
  getGymSession: () => api.get('/client/tracking/gym/session'),
  getGymHistory: () => api.get('/client/tracking/gym/history'),
}
