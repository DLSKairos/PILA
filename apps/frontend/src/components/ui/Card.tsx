interface CardProps {
  children: React.ReactNode
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, onClick, padding = 'md', className, style }: CardProps) {
  const paddings = { sm: '12px', md: '16px', lg: '24px' }
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: paddings[padding],
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'border-color 0.2s' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
