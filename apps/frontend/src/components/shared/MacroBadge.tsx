interface MacroBadgeProps {
  protein: number
  carbs: number
  fat: number
  calories?: number
  size?: 'sm' | 'md'
}

export function MacroBadge({ protein, carbs, fat, calories, size = 'md' }: MacroBadgeProps) {
  const fs = size === 'sm' ? 11 : 12
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {calories !== undefined && (
        <span style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: fs,
          color: 'var(--orange)',
          background: 'var(--orange-dim)',
          padding: '2px 6px',
          borderRadius: 'var(--radius-full)',
        }}>
          {calories} kcal
        </span>
      )}
      <span style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: fs,
        color: 'var(--blue)',
        background: 'rgba(59,130,246,0.1)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-full)',
      }}>
        P {protein}g
      </span>
      <span style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: fs,
        color: '#EAB308',
        background: 'rgba(234,179,8,0.1)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-full)',
      }}>
        C {carbs}g
      </span>
      <span style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: fs,
        color: 'var(--red)',
        background: 'rgba(255,45,45,0.1)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-full)',
      }}>
        G {fat}g
      </span>
    </div>
  )
}
