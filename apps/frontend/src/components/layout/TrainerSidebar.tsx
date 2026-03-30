import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { useTrainerStore } from '@/stores/trainer.store'
import { PATHS } from '@/router/paths'

const navItems = [
  { path: PATHS.TRAINER.DASHBOARD, label: 'Dashboard', icon: '⊞' },
  { path: PATHS.TRAINER.CLIENTS, label: 'Clientes', icon: '👥' },
  { path: PATHS.TRAINER.REPORTS, label: 'Reportes', icon: '📊' },
  { path: PATHS.TRAINER.SUBSCRIPTION, label: 'Suscripción', icon: '💳' },
  { path: PATHS.TRAINER.SETTINGS, label: 'Settings', icon: '⚙️' },
]

export function TrainerSidebar() {
  const profile = useTrainerStore(s => s.profile)
  return (
    <aside style={{
      width: 240, height: '100vh', position: 'fixed', left: 0, top: 0,
      background: 'var(--card)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: 'var(--orange)', letterSpacing: 2 }}>PILA</span>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              marginBottom: 4,
              textDecoration: 'none',
              color: isActive ? 'var(--orange)' : 'var(--txt-sub)',
              background: isActive ? 'var(--orange-dim)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              transition: 'all 0.2s',
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {/* Profile */}
      {profile && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.photoUrl} size="md" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{profile.firstName}</div>
            <div style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Entrenador</div>
          </div>
        </div>
      )}
    </aside>
  )
}
