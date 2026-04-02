import { NavLink } from 'react-router-dom'
import { useChatStore } from '@/stores/chat.store'
import { PATHS } from '@/router/paths'

const navItems = [
  { path: PATHS.CLIENT.HOME, label: 'Home', icon: '🏠' },
  { path: PATHS.CLIENT.NUTRITION, label: 'Nutrición', icon: '🥗' },
  { path: PATHS.CLIENT.GYM, label: 'Gym', icon: '🏋️' },
  { path: PATHS.CLIENT.CHAT, label: 'Chat', icon: '💬' },
  { path: PATHS.CLIENT.SETTINGS, label: 'Config', icon: '⚙️' },
]

export function ClientBottomNav() {
  const unreadCount = useChatStore(s => s.unreadCount)
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--card)', borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 4px', gap: 2, textDecoration: 'none',
            color: isActive ? 'var(--orange)' : 'var(--txt-dim)',
            fontSize: 10, fontWeight: isActive ? 600 : 400,
            transition: 'color 0.2s', position: 'relative',
          })}
        >
          <span style={{ fontSize: 20, position: 'relative' }}>
            {item.icon}
            {item.path === PATHS.CLIENT.CHAT && unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -6,
                background: 'var(--orange)', color: '#fff',
                borderRadius: 'var(--radius-full)', fontSize: 9,
                minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"DM Mono", monospace', padding: '0 3px',
                animation: 'pulse 2s ease infinite',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
