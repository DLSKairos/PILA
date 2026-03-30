import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { useChatStore } from '@/stores/chat.store'
import { PATHS } from '@/router/paths'

export function InAppMessageToast() {
  const [visible, setVisible] = useState(false)
  const [lastMessage, setLastMessage] = useState<{ content: string; senderName: string } | null>(null)
  const messages = useChatStore(s => s.messages)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    if (location.pathname === PATHS.CLIENT.CHAT) return
    if (!last.isRead) {
      setLastMessage({ content: last.content, senderName: 'Tu entrenador' })
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(t)
    }
  }, [messages, location.pathname])

  if (!visible || !lastMessage) return null

  return (
    <div
      onClick={() => { navigate(PATHS.CLIENT.CHAT); setVisible(false) }}
      style={{
        position: 'fixed',
        top: 70,
        left: 16,
        right: 16,
        zIndex: 9997,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--orange)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        animation: 'fadeUp 0.3s ease',
      }}
    >
      <Avatar name={lastMessage.senderName} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{lastMessage.senderName}</div>
        <div style={{
          fontSize: 13,
          color: 'var(--txt-sub)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {lastMessage.content.slice(0, 60)}{lastMessage.content.length > 60 ? '...' : ''}
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'var(--txt-dim)' }}>Toca para abrir</span>
    </div>
  )
}
