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
  const isRead = message.isRead || Boolean(message.readAt)

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
          color: isMine ? 'var(--txt-dim)' : 'var(--txt-sub)',
          marginTop: 4,
          textAlign: isMine ? 'right' : 'left',
          fontFamily: '"DM Mono", monospace',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          gap: 4,
        }}>
          <span>{formatTime(message.createdAt)}</span>
          {isMine && (
            <span style={{ color: isRead ? 'var(--orange)' : 'var(--txt-dim)' }}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
