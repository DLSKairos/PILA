import api from './api'

export const aiService = {
  generateNutritionPlan: (clientId: string) =>
    api.post(`/trainer/clients/${clientId}/ai/nutrition`),
  generateWorkoutPlan: (clientId: string) =>
    api.post(`/trainer/clients/${clientId}/ai/workout`),
  generateSubstitution: (clientId: string, mealItemId: string) =>
    api.post(`/trainer/clients/${clientId}/ai/substitution`, { mealItemId }),
  sendOnboardingMessage: (message: string) =>
    api.post('/client/onboarding/message', { message }),
  getOnboardingStatus: () =>
    api.get('/client/onboarding/status'),
}
