import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { PATHS } from '@/router/paths'

interface RoleGuardProps {
  role: 'TRAINER' | 'CLIENT'
}

export function RoleGuard({ role }: RoleGuardProps) {
  const userRole = useAuthStore(s => s.role)
  if (userRole !== role) {
    return <Navigate to={userRole === 'TRAINER' ? PATHS.TRAINER.DASHBOARD : PATHS.CLIENT.HOME} replace />
  }
  return <Outlet />
}
