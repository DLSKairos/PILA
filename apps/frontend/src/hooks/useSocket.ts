import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'
import { useChatStore } from '@/stores/chat.store'
import type { Message } from '@/types/chat.types'

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accessToken = useAuthStore(s => s.accessToken)
  const { addMessage, setTyping, setConnected, incrementUnread } = useChatStore()

  useEffect(() => {
    if (!accessToken) return

    // Cancela un disconnect pendiente del ciclo anterior de StrictMode
    if (disconnectTimerRef.current !== null) {
      clearTimeout(disconnectTimerRef.current)
      disconnectTimerRef.current = null
    }

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
    socket.on('new_message', (raw: any) => {
      // El backend devuelve el objeto Prisma con clientId/trainerId pero sin senderId.
      // Normalizamos para que isMine={msg.senderId === userId} funcione correctamente.
      const message: Message = {
        ...raw,
        senderId: raw.senderId ?? (raw.senderRole === 'TRAINER' ? raw.trainerId : raw.clientId),
      }
      addMessage(message)
      incrementUnread()
    })
    socket.on('typing', ({ isTyping }: { isTyping: boolean }) => setTyping(isTyping))

    return () => {
      // Retrasa el disconnect 100 ms para que StrictMode pueda cancelarlo
      // si el componente se vuelve a montar de inmediato (doble-mount en dev).
      // En un desmonte real el timer completa y desconecta limpiamente.
      disconnectTimerRef.current = setTimeout(() => {
        socket.disconnect()
        setConnected(false)
        disconnectTimerRef.current = null
      }, 100)
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
