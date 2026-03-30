import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/app.store'

export function OfflineBanner() {
  const isOnline = useAppStore(s => s.isOnline)
  const [showRestored, setShowRestored] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline) {
      setShowRestored(true)
      const t = setTimeout(() => { setShowRestored(false); setWasOffline(false) }, 2500)
      return () => clearTimeout(t)
    }
  }, [isOnline, wasOffline])

  if (isOnline && !showRestored) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: showRestored ? 'rgba(34,197,94,0.15)' : '#1A0A00',
        color: showRestored ? 'var(--green)' : 'var(--orange)',
        fontSize: 13,
        fontWeight: 500,
        borderBottom: `1px solid ${showRestored ? 'var(--green)' : 'var(--orange)'}`,
        transition: 'all 0.3s',
      }}
    >
      {showRestored ? '✓ Conexión restaurada' : '⚡ Sin conexión — modo offline'}
    </div>
  )
}
