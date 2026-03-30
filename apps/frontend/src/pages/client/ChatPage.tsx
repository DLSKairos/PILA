import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/stores/chat.store'
import { useAuthStore } from '@/stores/auth.store'
import { chatService } from '@/services/chat.service'
import { useSocket } from '@/hooks/useSocket'
import { MessageBubble } from '@/components/shared/MessageBubble'
import { Loader } from '@/components/ui'
import type { Message } from '@/types/chat.types'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const { messages, setMessages, markAllRead, isTyping, isConnected } = useChatStore()
  const { userId } = useAuthStore()
  const { sendMessage, sendTyping } = useSocket()
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    chatService.getMessages('me')
      .then(res => {
        setMessages((res.data as { data: Message[] }).data ?? [])
        markAllRead()
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setMessages, markAllRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
    sendTyping(false)
  }

  const handleTyping = (val: string) => {
    setInput(val)
    sendTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => sendTyping(false), 1000)
  }

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
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === userId}
            />
          ))
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
