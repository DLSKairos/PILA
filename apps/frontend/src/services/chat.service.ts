import api from './api'

export const chatService = {
  getMessages: (clientId: string, params?: { limit?: number; before?: string }) =>
    api.get(`/chat/${clientId}/messages`, { params }),
  markAsRead: (clientId: string) =>
    api.patch(`/chat/${clientId}/read`),
  markAsReadClient: (trainerId: string) =>
    api.patch('/chat/me/read', { trainerId }),
  getUnreadCount: () =>
    api.get('/chat/unread-count'),
  getConversations: () =>
    api.get('/chat/conversations'),
}
