import api from './api'

export const clientsService = {
  getAll: () => api.get('/trainer/clients'),
  getOne: (id: string) => api.get(`/trainer/clients/${id}`),
  create: (data: unknown) => api.post('/trainer/clients', data),
  update: (id: string, data: unknown) => api.patch(`/trainer/clients/${id}`, data),
  delete: (id: string) => api.delete(`/trainer/clients/${id}`),
  getProfile: (id: string) => api.get(`/trainer/clients/${id}/profile`),
  updateProfile: (id: string, data: unknown) => api.patch(`/trainer/clients/${id}/profile`, data),
  getGyms: (id: string) => api.get(`/trainer/clients/${id}/gyms`),
  addGym: (id: string, data: unknown) => api.post(`/trainer/clients/${id}/gyms`, data),
  getRestrictions: (id: string) => api.get(`/trainer/clients/${id}/restrictions`),
  getInjuries: (id: string) => api.get(`/trainer/clients/${id}/injuries`),
  getFeedback: (id: string, params?: { resolved?: string; type?: string }) =>
    api.get(`/trainer/clients/${id}/feedback`, { params }),
}
