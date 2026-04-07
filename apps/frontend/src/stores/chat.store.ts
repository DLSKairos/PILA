import { create } from 'zustand'
import type { Message } from '@/types/chat.types'

interface LastReadUpdate {
  readBy: 'TRAINER' | 'CLIENT'
  timestamp: string
}

interface ChatStore {
  messages: Message[]
  unreadCount: number
  isConnected: boolean
  isTyping: boolean
  activeClientId: string | null
  lastReadUpdate: LastReadUpdate | null

  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  markAllRead: () => void
  markMessagesRead: (readBy: 'TRAINER' | 'CLIENT') => void
  setTyping: (typing: boolean) => void
  setConnected: (connected: boolean) => void
  setActiveClientId: (id: string | null) => void
  incrementUnread: () => void
  setUnreadCount: (count: number) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  unreadCount: 0,
  isConnected: false,
  isTyping: false,
  activeClientId: null,
  lastReadUpdate: null,

  addMessage: (message) =>
    set((s) => {
      // Si ya existe un mensaje con el mismo id, no agregar
      if (s.messages.some(m => m.id === message.id)) return s
      // Si hay un optimista con el mismo contenido y senderRole, reemplazarlo
      const optimisticIdx = s.messages.findIndex(
        m => m.id.startsWith('optimistic-') && m.content === message.content && m.senderRole === message.senderRole
      )
      if (optimisticIdx !== -1) {
        const next = [...s.messages]
        next[optimisticIdx] = message
        return { messages: next }
      }
      return { messages: [...s.messages, message] }
    }),

  setMessages: (messages) => set({ messages }),

  markAllRead: () => set({ unreadCount: 0 }),

  markMessagesRead: (readBy) => {
    // readBy === 'TRAINER' means the trainer read CLIENT's messages → mark senderRole CLIENT as read
    // readBy === 'CLIENT' means the client read TRAINER's messages → mark senderRole TRAINER as read
    const targetRole = readBy === 'TRAINER' ? 'CLIENT' : 'TRAINER'
    const timestamp = new Date().toISOString()
    set((s) => ({
      messages: s.messages.map(m =>
        m.senderRole === targetRole && !m.readAt
          ? { ...m, readAt: timestamp, isRead: true }
          : m
      ),
      lastReadUpdate: { readBy, timestamp },
    }))
  },

  setTyping: (isTyping) => set({ isTyping }),

  setConnected: (isConnected) => set({ isConnected }),

  setActiveClientId: (activeClientId) => set({ activeClientId }),

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),
}))
