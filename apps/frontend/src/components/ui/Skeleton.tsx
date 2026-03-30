interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'list'
  lines?: number
  className?: string
}

const pulse: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--card) 25%, var(--border) 50%, var(--card) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 'var(--radius-md)',
}

export function Skeleton({ variant = 'text', lines = 1, className }: SkeletonProps) {
  if (variant === 'avatar') return (
    <div style={{ ...pulse, width: 40, height: 40, borderRadius: '50%' }} className={className} />
  )
  if (variant === 'card') return (
    <div style={{ ...pulse, height: 120 }} className={className} />
  )
  if (variant === 'list') return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ ...pulse, height: 16, width: i % 3 === 0 ? '60%' : '100%' }} />
      ))}
    </div>
  )
  return <div style={{ ...pulse, height: 16 }} className={className} />
}
