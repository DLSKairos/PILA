import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './guards/AuthGuard'
import { RoleGuard } from './guards/RoleGuard'
import { PlanGuard } from './guards/PlanGuard'
import { TrainerLayout } from '@/components/layout/TrainerLayout'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { Loader } from '@/components/ui/Loader'
import { PATHS } from './paths'
import { isPWA, isDesktop } from '@/utils/pwa.util'
import { useAuthStore } from '@/stores/auth.store'

// Lazy pages - Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const ActivatePage = lazy(() => import('@/pages/auth/ActivatePage'))
const InstallPage = lazy(() => import('@/pages/install/InstallPage'))

// Lazy pages - Trainer
const DashboardPage = lazy(() => import('@/pages/trainer/DashboardPage'))
const ClientsPage = lazy(() => import('@/pages/trainer/ClientsPage'))
const ClientDetailPage = lazy(() => import('@/pages/trainer/ClientDetailPage'))
const NutritionPlanPage = lazy(() => import('@/pages/trainer/NutritionPlanPage'))
const WorkoutPlanPage = lazy(() => import('@/pages/trainer/WorkoutPlanPage'))
const ReportsPage = lazy(() => import('@/pages/trainer/ReportsPage'))
const SubscriptionPage = lazy(() => import('@/pages/trainer/SubscriptionPage'))
const TrainerSettingsPage = lazy(() => import('@/pages/trainer/SettingsPage'))
const SubscriptionExpiredPage = lazy(() => import('@/pages/trainer/SubscriptionExpiredPage'))

// Lazy pages - Client
const OnboardingPage = lazy(() => import('@/pages/client/OnboardingPage'))
const ClientHomePage = lazy(() => import('@/pages/client/HomePage'))
const ClientNutritionPage = lazy(() => import('@/pages/client/NutritionPage'))
const GymModePage = lazy(() => import('@/pages/client/GymModePage'))
const ClientProgressPage = lazy(() => import('@/pages/client/ProgressPage'))
const ClientChatPage = lazy(() => import('@/pages/client/ChatPage'))
const ClientSettingsPage = lazy(() => import('@/pages/client/SettingsPage'))

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Loader size="lg" />
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// Root redirect component
function RootRedirect() {
  const { isAuthenticated, role } = useAuthStore()
  if (isPWA() || isDesktop()) {
    if (isAuthenticated) {
      return <Navigate to={role === 'TRAINER' ? PATHS.TRAINER.DASHBOARD : PATHS.CLIENT.HOME} replace />
    }
    return <Navigate to={PATHS.LOGIN} replace />
  }
  return <Navigate to={PATHS.INSTALL} replace />
}

export const router = createBrowserRouter([
  { path: PATHS.ROOT, element: <RootRedirect /> },

  // Public routes
  { path: PATHS.LOGIN, element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
  { path: PATHS.REGISTER, element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper> },
  { path: PATHS.FORGOT_PASSWORD, element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper> },
  { path: PATHS.RESET_PASSWORD, element: <SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper> },
  { path: PATHS.ACTIVATE, element: <SuspenseWrapper><ActivatePage /></SuspenseWrapper> },
  { path: PATHS.INSTALL, element: <SuspenseWrapper><InstallPage /></SuspenseWrapper> },

  // Subscription expired (needs auth but not plan)
  {
    element: <AuthGuard />,
    children: [
      { path: PATHS.SUBSCRIPTION_EXPIRED, element: <SuspenseWrapper><SubscriptionExpiredPage /></SuspenseWrapper> },
    ],
  },

  // Trainer routes
  {
    element: <AuthGuard />,
    children: [{
      element: <RoleGuard role="TRAINER" />,
      children: [{
        element: <PlanGuard />,
        children: [{
          element: <TrainerLayout />,
          children: [
            { path: PATHS.TRAINER.DASHBOARD, element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
            { path: PATHS.TRAINER.CLIENTS, element: <SuspenseWrapper><ClientsPage /></SuspenseWrapper> },
            { path: '/trainer/clients/:id', element: <SuspenseWrapper><ClientDetailPage /></SuspenseWrapper> },
            { path: '/trainer/clients/:id/nutrition', element: <SuspenseWrapper><NutritionPlanPage /></SuspenseWrapper> },
            { path: '/trainer/clients/:id/workout', element: <SuspenseWrapper><WorkoutPlanPage /></SuspenseWrapper> },
            { path: PATHS.TRAINER.REPORTS, element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
            { path: PATHS.TRAINER.SUBSCRIPTION, element: <SuspenseWrapper><SubscriptionPage /></SuspenseWrapper> },
            { path: PATHS.TRAINER.SETTINGS, element: <SuspenseWrapper><TrainerSettingsPage /></SuspenseWrapper> },
          ],
        }],
      }],
    }],
  },

  // Client routes
  {
    element: <AuthGuard />,
    children: [{
      element: <RoleGuard role="CLIENT" />,
      children: [{
        element: <ClientLayout />,
        children: [
          { path: PATHS.CLIENT.HOME, element: <SuspenseWrapper><ClientHomePage /></SuspenseWrapper> },
          { path: PATHS.CLIENT.ONBOARDING, element: <SuspenseWrapper><OnboardingPage /></SuspenseWrapper> },
          { path: PATHS.CLIENT.NUTRITION, element: <SuspenseWrapper><ClientNutritionPage /></SuspenseWrapper> },
          { path: PATHS.CLIENT.GYM, element: <SuspenseWrapper><GymModePage /></SuspenseWrapper> },
          { path: PATHS.CLIENT.PROGRESS, element: <SuspenseWrapper><ClientProgressPage /></SuspenseWrapper> },
          { path: PATHS.CLIENT.CHAT, element: <SuspenseWrapper><ClientChatPage /></SuspenseWrapper> },
          { path: PATHS.CLIENT.SETTINGS, element: <SuspenseWrapper><ClientSettingsPage /></SuspenseWrapper> },
        ],
      }],
    }],
  },

  // Catch all
  { path: '*', element: <Navigate to={PATHS.ROOT} replace /> },
])
