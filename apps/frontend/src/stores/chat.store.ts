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
    set((s) => ({ messages: [...s.messages, message] })),

  setMessages: (messages) => set({ messages }),

  markAllRead: () => set({ unreadCount: 0 }),

  setTyping: (isTyping) => set({ isTyping }),

  setConnected: (isConnected) => set({ isConnected }),

  setActiveClientId: (activeClientId) => set({ activeClientId }),

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),
}))
