import api from './api'

export const nutritionService = {
  getActivePlan: (clientId: string) => api.get(`/trainer/clients/${clientId}/nutrition`),
  getPlan: (clientId: string, planId: string) => api.get(`/trainer/clients/${clientId}/nutrition/${planId}`),
  createPlan: (clientId: string, data: unknown) => api.post(`/trainer/clients/${clientId}/nutrition`, data),
  updatePlan: (clientId: string, planId: string, data: unknown) =>
    api.patch(`/trainer/clients/${clientId}/nutrition/${planId}`, data),
  generateWithAI: (clientId: string) => api.post(`/trainer/clients/${clientId}/ai/nutrition`),
  approvePlan: (clientId: string, planId: string) =>
    api.post(`/trainer/clients/${clientId}/nutrition/${planId}/approve`),
  searchFoods: (query: string) => api.get('/nutrition/foods/search', { params: { q: query } }),
  addMeal: (clientId: string, planId: string, data: unknown) =>
    api.post(`/trainer/clients/${clientId}/nutrition/${planId}/meals`, data),
  addMealItem: (clientId: string, planId: string, mealId: string, data: unknown) =>
    api.post(`/trainer/clients/${clientId}/nutrition/${planId}/meals/${mealId}/items`, data),
  // Client endpoints
  getMyPlan: () => api.get('/client/nutrition'),
}
