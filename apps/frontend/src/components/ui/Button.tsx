import { Loader } from './Loader'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--orange)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--card)', color: 'var(--txt)', border: '1px solid var(--border)' },
  ghost: { background: 'transparent', color: 'var(--txt)', border: '1px solid var(--border)' },
  danger: { background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)' },
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '13px', borderRadius: 'var(--radius-md)' },
  md: { padding: '10px 20px', fontSize: '15px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '14px 28px', fontSize: '16px', borderRadius: 'var(--radius-lg)' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s, transform 0.1s',
        ...style,
      }}
      {...props}
    >
      {loading && <Loader size="sm" color={variant === 'primary' ? '#fff' : 'var(--orange)'} />}
      {children}
    </button>
  )
}
