import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { LangProvider } from '@/providers/LangProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { PILAToaster } from '@/components/ui/Toast'
import { router } from '@/router'
import { useOffline } from '@/hooks/useOffline'
import { usePWAInstall } from '@/hooks/usePWAInstall'

function AppShell() {
  useOffline()
  usePWAInstall()
  return (
    <>
      <RouterProvider router={router} />
      <PILAToaster />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
