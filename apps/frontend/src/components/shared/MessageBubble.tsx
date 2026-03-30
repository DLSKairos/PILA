import { Avatar } from '@/components/ui/Avatar'
import { formatTime } from '@/utils/format.util'
import type { Message } from '@/types/chat.types'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  senderName?: string
  senderPhoto?: string
}

export function MessageBubble({ message, isMine, senderName, senderPhoto }: MessageBubbleProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMine ? 'row-reverse' : 'row',
      gap: 8,
      marginBottom: 12,
      alignItems: 'flex-end',
    }}>
      {!isMine && <Avatar name={senderName} src={senderPhoto} size="sm" />}
      <div style={{ maxWidth: '75%' }}>
        <div style={{
          background: isMine ? 'var(--orange)' : 'var(--card)',
          border: isMine ? 'none' : '1px solid var(--border)',
          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '10px 14px',
          color: isMine ? '#fff' : 'var(--txt)',
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--txt-dim)',
          marginTop: 4,
          textAlign: isMine ? 'right' : 'left',
          fontFamily: '"DM Mono", monospace',
        }}>
          {formatTime(message.createdAt)}
          {isMine && <span style={{ marginLeft: 4 }}>{message.isRead ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  )
}
