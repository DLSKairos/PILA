interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
}

const sizes = { sm: 28, md: 36, lg: 48, xl: 72 }

export function Avatar({ src, name, size = 'md', online }: AvatarProps) {
  const px = sizes[size]
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: px, height: px, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
        />
      ) : (
        <div style={{
          width: px,
          height: px,
          borderRadius: '50%',
          background: 'var(--orange-dim)',
          border: '2px solid var(--orange)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--orange)',
          fontSize: px * 0.35,
          fontFamily: '"Bebas Neue", sans-serif',
          letterSpacing: 1,
        }}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: px * 0.25,
          height: px * 0.25,
          borderRadius: '50%',
          background: online ? 'var(--green)' : 'var(--txt-dim)',
          border: '2px solid var(--card)',
        }} />
      )}
    </div>
  )
}
