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

interface TrainerSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function TrainerSidebar({ isCollapsed, onToggle }: TrainerSidebarProps) {
  const profile = useTrainerStore(s => s.profile)
  const sidebarWidth = isCollapsed ? 64 : 240

  return (
    <aside style={{
      width: sidebarWidth,
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'var(--card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden',
      transition: 'width 0.2s ease',
    }}>
      {/* Logo + Toggle */}
      <div style={{
        padding: isCollapsed ? '24px 0' : '24px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        minHeight: 72,
      }}>
        {!isCollapsed && (
          <span style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 28,
            color: 'var(--orange)',
            letterSpacing: 2,
            flexShrink: 0,
          }}>
            PILA
          </span>
        )}
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          style={{
            background: 'var(--orange-dim)',
            border: '1px solid var(--orange)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--orange)',
            fontSize: 16,
            fontWeight: 700,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.2s, border-color 0.2s',
            lineHeight: 1,
          }}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: isCollapsed ? '12px 8px' : '12px 12px', overflow: 'hidden' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? 0 : 10,
              padding: isCollapsed ? '10px 0' : '10px 12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 4,
              textDecoration: 'none',
              color: isActive ? 'var(--orange)' : 'var(--txt-sub)',
              background: isActive ? 'var(--orange-dim)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              transition: 'all 0.2s',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            })}
          >
            <span style={{ fontSize: isCollapsed ? 20 : 16, flexShrink: 0 }}>{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Profile */}
      {profile && !isCollapsed && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          overflow: 'hidden',
        }}>
          <Avatar name={profile.name} src={profile.photoUrl} size="md" />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--txt)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {profile.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Entrenador</div>
          </div>
        </div>
      )}

      {/* Profile colapsado: solo avatar */}
      {profile && isCollapsed && (
        <div style={{
          padding: '16px 0',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Avatar name={profile.name} src={profile.photoUrl} size="sm" />
        </div>
      )}
    </aside>
  )
}
