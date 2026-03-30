type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'

const colors: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)', color: 'var(--green)' },
  warning: { bg: 'rgba(234,179,8,0.12)', color: '#EAB308' },
  error: { bg: 'rgba(255,45,45,0.12)', color: 'var(--red)' },
  info: { bg: 'rgba(59,130,246,0.12)', color: 'var(--blue)' },
  neutral: { bg: 'var(--border)', color: 'var(--txt-sub)' },
  orange: { bg: 'var(--orange-dim)', color: 'var(--orange)' },
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  pulse?: boolean
  className?: string
}

export function Badge({ variant = 'neutral', children, dot, pulse, className }: BadgeProps) {
  const c = colors[variant]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: c.bg,
        color: c.color,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontFamily: '"DM Mono", monospace',
        fontWeight: 500,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: c.color,
            animation: pulse ? 'pulse 2s ease infinite' : undefined,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}
