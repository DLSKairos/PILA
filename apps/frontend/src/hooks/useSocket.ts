import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'
import { useChatStore } from '@/stores/chat.store'
import type { Message } from '@/types/chat.types'

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const accessToken = useAuthStore(s => s.accessToken)
  const { addMessage, setTyping, setConnected, incrementUnread } = useChatStore()

  useEffect(() => {
    if (!accessToken) return

    socketRef.current = io(import.meta.env.VITE_WS_URL, {
      path: '/socket.io',
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    const socket = socketRef.current
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('new_message', (message: Message) => {
      addMessage(message)
      incrementUnread()
    })
    socket.on('typing', ({ isTyping }: { isTyping: boolean }) => setTyping(isTyping))

    return () => {
      socket.disconnect()
      setConnected(false)
    }
  }, [accessToken, addMessage, setTyping, setConnected, incrementUnread])

  const sendMessage = (content: string, clientId?: string, trainerId?: string, attachmentUrl?: string, attachmentType?: string) => {
    socketRef.current?.emit('send_message', { content, clientId, trainerId, attachmentUrl, attachmentType })
  }

  const sendTyping = (isTyping: boolean, clientId?: string) => {
    socketRef.current?.emit('typing', { isTyping, clientId })
  }

  return { sendMessage, sendTyping, socket: socketRef.current }
}
