export type MessageSender = 'TRAINER' | 'CLIENT'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderRole: MessageSender
  content: string
  attachmentUrl?: string
  attachmentType?: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

export interface Conversation {
  id: string
  trainerId: string
  clientId: string
  lastMessage?: Message
  unreadCount: number
}
