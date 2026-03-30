interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Checkbox({ checked, onChange, label, disabled, size = 'md' }: CheckboxProps) {
  const px = size === 'sm' ? 18 : 22
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: px,
          height: px,
          borderRadius: 'var(--radius-sm)',
          border: `2px solid ${checked ? 'var(--orange)' : 'var(--border)'}`,
          background: checked ? 'var(--orange)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        {checked && <span style={{ color: '#fff', fontSize: px * 0.65, lineHeight: 1 }}>✓</span>}
      </div>
      {label && <span style={{ fontSize: 14, color: 'var(--txt)' }}>{label}</span>}
    </label>
  )
}
