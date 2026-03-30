interface StreakCounterProps {
  count: number
  size?: 'sm' | 'lg'
}

export function StreakCounter({ count, size = 'lg' }: StreakCounterProps) {
  const getGlow = () => {
    if (count >= 30) return '0 0 30px rgba(255,92,0,0.6), 0 0 60px rgba(255,45,45,0.3)'
    if (count >= 14) return '0 0 20px rgba(255,92,0,0.4)'
    if (count >= 7) return '0 0 12px rgba(255,92,0,0.25)'
    return 'none'
  }

  const getColor = () => {
    if (count >= 30) return 'linear-gradient(135deg, #FF2D2D, #FF5C00)'
    if (count >= 14) return 'linear-gradient(135deg, #FF5C00, #FF8C00)'
    return 'var(--orange)'
  }

  if (size === 'sm') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 20,
        background: getColor(),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: 'none',
      }}>
        {count}
      </span>
      <span style={{ fontSize: 14 }}>🔥</span>
    </div>
  )

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 80,
        lineHeight: 1,
        background: getColor(),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: `drop-shadow(${getGlow()})`,
      }}>
        {count}
      </div>
      <div style={{ fontSize: 32, marginTop: -8 }}>🔥</div>
      <div style={{
        fontSize: 12,
        color: 'var(--txt-sub)',
        fontFamily: '"DM Mono", monospace',
        marginTop: 4,
      }}>
        {count} días de racha
      </div>
    </div>
  )
}
