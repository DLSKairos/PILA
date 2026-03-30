import { Navigate, Outlet } from 'react-router-dom'
import { useTrainerStore } from '@/stores/trainer.store'
import { PATHS } from '@/router/paths'

export function PlanGuard() {
  const subscription = useTrainerStore(s => s.subscription)
  if (subscription && (subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED')) {
    return <Navigate to={PATHS.SUBSCRIPTION_EXPIRED} replace />
  }
  return <Outlet />
}
