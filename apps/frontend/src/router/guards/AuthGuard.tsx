import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { PATHS } from '@/router/paths'

export function AuthGuard() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to={PATHS.LOGIN} replace />
  return <Outlet />
}
