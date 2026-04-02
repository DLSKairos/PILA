import { create } from 'zustand'
import type { Message } from '@/types/chat.types'

interface ChatStore {
  messages: Message[]
  unreadCount: number
  isConnected: boolean
  isTyping: boolean
  activeClientId: string | null

  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  markAllRead: () => void
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

  setTyping: (isTyping) => set({ isTyping }),

  setConnected: (isConnected) => set({ isConnected }),

  setActiveClientId: (activeClientId) => set({ activeClientId }),

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),
}))
