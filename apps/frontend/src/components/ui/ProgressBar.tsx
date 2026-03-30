interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: number
  showLabel?: boolean
  label?: string
  animated?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  color,
  height = 6,
  showLabel,
  label,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(showLabel || label) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--txt-sub)' }}>
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ height, background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color ?? 'var(--orange)',
            borderRadius: 'var(--radius-full)',
            transition: animated ? 'width 0.5s ease' : undefined,
          }}
        />
      </div>
    </div>
  )
}
