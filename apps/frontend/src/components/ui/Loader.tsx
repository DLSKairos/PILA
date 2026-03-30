interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export function Loader({ size = 'md', color }: LoaderProps) {
  const sizes = { sm: 20, md: 32, lg: 48 }
  const px = sizes[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite', color: color ?? 'var(--orange)' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="40"
        strokeDashoffset="30"
        strokeLinecap="round"
      />
    </svg>
  )
}
