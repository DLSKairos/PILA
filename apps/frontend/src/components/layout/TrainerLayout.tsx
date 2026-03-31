import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { TrainerSidebar } from './TrainerSidebar'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { Avatar } from '@/components/ui/Avatar'
import { useTrainerStore } from '@/stores/trainer.store'
import { PATHS } from '@/router/paths'

const mobileNavItems = [
  { path: PATHS.TRAINER.DASHBOARD, label: 'Inicio', icon: '⊞' },
  { path: PATHS.TRAINER.CLIENTS, label: 'Clientes', icon: '👥' },
  { path: PATHS.TRAINER.REPORTS, label: 'Reportes', icon: '📊' },
  { path: PATHS.TRAINER.SETTINGS, label: 'Settings', icon: '⚙️' },
]

export function TrainerLayout() {
  const profile = useTrainerStore(s => s.profile)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sidebarWidth = isCollapsed ? 64 : 240

  return (
    <div
      style={
        { minHeight: '100vh', background: 'var(--bg)', '--sidebar-w': `${sidebarWidth}px` } as React.CSSProperties
      }
    >
      <OfflineBanner />
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <TrainerSidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(prev => !prev)}
        />
      </div>
      {/* Mobile header */}
      <header className="md:hidden" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--card)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, color: 'var(--orange)', letterSpacing: 2 }}>PILA</span>
        {profile && <Avatar name={profile.name} src={profile.photoUrl} size="sm" />}
      </header>
      {/* Main content */}
      <main className="trainer-main">
        <Outlet />
      </main>
      {/* Mobile bottom nav */}
      <nav className="md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--card)', borderTop: '1px solid var(--border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {mobileNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 4px', gap: 2, textDecoration: 'none',
              color: isActive ? 'var(--orange)' : 'var(--txt-dim)',
              fontSize: 10, fontWeight: isActive ? 600 : 400,
              transition: 'color 0.2s',
            })}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
