import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  textarea?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, textarea: _textarea, style, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      width: '100%',
      background: 'var(--card)',
      border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      color: 'var(--txt)',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '15px',
      padding: leftIcon ? '10px 12px 10px 36px' : '10px 12px',
      outline: 'none',
      transition: 'border-color 0.2s',
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label style={{ fontSize: '13px', color: 'var(--txt-sub)', fontWeight: 500 }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {leftIcon && (
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-dim)' }}>
              {leftIcon}
            </span>
          )}
          <input ref={ref} style={{ ...baseStyle, ...style }} {...props} />
          {rightIcon && (
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-dim)' }}>
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
