import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClientBottomNav } from './ClientBottomNav'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { Avatar } from '@/components/ui/Avatar'
import { useClientStore } from '@/stores/client.store'
import { useTrackingStore } from '@/stores/tracking.store'
import { aiService } from '@/services/ai.service'
import { PATHS } from '@/router/paths'

export function ClientLayout() {
  const profile = useClientStore(s => s.profile)
  const gymSessionActive = useTrackingStore(s => s.gymSessionActive)
  const location = useLocation()
  const navigate = useNavigate()
  const isGymMode = location.pathname === PATHS.CLIENT.GYM && gymSessionActive
  const isOnboardingPage = location.pathname === PATHS.CLIENT.ONBOARDING
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)

  useEffect(() => {
    if (isOnboardingPage) return
    aiService.getOnboardingStatus()
      .then(res => {
        const data = (res.data as { data?: { completed?: boolean } }).data
        if (data?.completed === false) setShowOnboardingBanner(true)
      })
      .catch(() => {})
  // Solo verificar una vez al montar el layout o cuando cambia la ruta principal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <OfflineBanner />
      {showOnboardingBanner && !isOnboardingPage && (
        <div style={{
          position: 'fixed',
          top: 60,
          left: 0,
          right: 0,
          zIndex: 99,
          background: 'var(--orange)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
            Completa tu perfil para empezar
          </span>
          <button
            onClick={() => navigate(PATHS.CLIENT.ONBOARDING)}
            style={{
              background: '#fff',
              color: 'var(--orange)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Completar
          </button>
        </div>
      )}
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
      {/* Main — ajustar padding según gym mode y banner de onboarding */}
      <main style={{
        paddingTop: isGymMode ? 0 : (showOnboardingBanner && !isOnboardingPage ? 100 : 60),
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
