import { Outlet, useLocation } from 'react-router-dom'
import { ClientBottomNav } from './ClientBottomNav'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { Avatar } from '@/components/ui/Avatar'
import { useClientStore } from '@/stores/client.store'
import { useTrackingStore } from '@/stores/tracking.store'
import { PATHS } from '@/router/paths'

export function ClientLayout() {
  const profile = useClientStore(s => s.profile)
  const gymSessionActive = useTrackingStore(s => s.gymSessionActive)
  const location = useLocation()
  const isGymMode = location.pathname === PATHS.CLIENT.GYM && gymSessionActive

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <OfflineBanner />
      {/* Header — ocultar en gym mode activo */}
      {!isGymMode && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--card)', borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, color: 'var(--orange)', letterSpacing: 2 }}>PILA</span>
          {profile && <Avatar name={`${profile.firstName} ${profile.lastName}`} size="sm" />}
        </header>
      )}
      {/* Main — ajustar padding según gym mode */}
      <main style={{
        paddingTop: isGymMode ? 0 : 60,
        paddingBottom: isGymMode ? 0 : 70,
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>
      {/* Bottom nav — ocultar en gym mode activo */}
      {!isGymMode && <ClientBottomNav />}
    </div>
  )
}
