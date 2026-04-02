import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useChatStore } from '@/stores/chat.store'
import { useAuthStore } from '@/stores/auth.store'
import { chatService } from '@/services/chat.service'
import { useSocket } from '@/hooks/useSocket'
import { MessageBubble } from '@/components/shared/MessageBubble'
import { Loader } from '@/components/ui'
import type { Message } from '@/types/chat.types'

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return format(date, 'd MMM', { locale: es })
}

function DateSeparator({ date }: { date: Date }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--txt-sub)', fontFamily: '"DM Sans"' }}>
        {getDateLabel(date)}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const { messages, setMessages, addMessage, markAllRead, isTyping, isConnected } = useChatStore()
  const { userId } = useAuthStore()
  const { sendMessage, sendTyping } = useSocket()
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trainerIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Carga mensajes independientemente de getConversations para que un
    // fallo en conversations no borre el historial del chat.
    chatService.getMessages('me')
      .then(res => {
        const msgs: Message[] = (res.data as { data: Message[] }).data ?? []
        setMessages(msgs)
        markAllRead()
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Extraer trainerId en paralelo, sin bloquear la carga de mensajes
    chatService.getConversations()
      .then(res => {
        const conversations = (res.data as { data: { trainerId: string }[] }).data ?? []
        if (conversations.length > 0) {
          trainerIdRef.current = conversations[0].trainerId
        }
      })
      .catch(() => {})
  }, [setMessages, markAllRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const content = input.trim()
    if (!content) return

    // Optimistic update: agregar mensaje localmente antes de la respuesta del servidor
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      conversationId: '',
      senderId: userId ?? '',
      senderRole: 'CLIENT',
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    addMessage(optimisticMessage)

    sendMessage(content, undefined, trainerIdRef.current ?? undefined)
    setInput('')
    sendTyping(false)
  }

  const handleTyping = (val: string) => {
    setInput(val)
    sendTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => sendTyping(false), 1000)
  }

  // Construir lista de elementos con separadores de fecha intercalados
  const messageElements: React.ReactNode[] = []
  let lastDate: Date | null = null

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt)
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      messageElements.push(
        <DateSeparator key={`sep-${msg.id}`} date={msgDate} />
      )
      lastDate = msgDate
    }
    messageElements.push(
      <MessageBubble
        key={msg.id}
        message={msg}
        isMine={msg.senderRole === 'CLIENT'}
      />
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px - 70px)' }}>
      {/* Header estado */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isConnected ? 'var(--green)' : 'var(--txt-dim)',
        }} />
        <span style={{ fontSize: 12, color: 'var(--txt-sub)' }}>
          {isConnected ? 'Conectado' : 'Desconectado'} · Chat con tu entrenador
        </span>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--txt-sub)', padding: 32 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
            <p>Escríbele a tu entrenador</p>
          </div>
        ) : (
          messageElements
        )}
        {isTyping && (
          <div style={{
            display: 'flex',
            gap: 4,
            padding: '8px 16px',
            color: 'var(--txt-sub)',
            fontSize: 12,
            alignItems: 'center',
          }}>
            <span>Tu entrenador está escribiendo</span>
            <span>...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 8,
        background: 'var(--card)',
      }}>
        <input
          value={input}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '10px 16px',
            color: 'var(--txt)',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: input.trim() ? 'var(--orange)' : 'var(--border)',
            color: '#fff',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
