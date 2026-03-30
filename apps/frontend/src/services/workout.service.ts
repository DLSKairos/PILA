import api from './api'

export const workoutService = {
  getActivePlan: (clientId: string) => api.get(`/trainer/clients/${clientId}/workout/active`),
  createPlan: (clientId: string, data: unknown) => api.post(`/trainer/clients/${clientId}/workout`, data),
  generateWithAI: (clientId: string) => api.post(`/trainer/clients/${clientId}/ai/workout`),
  approvePlan: (clientId: string, planId: string) =>
    api.post(`/trainer/clients/${clientId}/workout/${planId}/approve`),
  addDay: (clientId: string, planId: string, data: unknown) =>
    api.post(`/trainer/clients/${clientId}/workout/${planId}/days`, data),
  addExercise: (clientId: string, planId: string, dayId: string, data: unknown) =>
    api.post(`/trainer/clients/${clientId}/workout/${planId}/days/${dayId}/exercises`, data),
  getLibrary: (params?: { muscle?: string; difficulty?: string }) =>
    api.get('/workout/exercises/library', { params }),
  // Client endpoints
  getTodayWorkout: () => api.get('/client/workout/today'),
  getMyPlan: () => api.get('/client/workout/active'),
}
