import { useEffect, useState } from 'react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { Loader } from '@/components/ui/Loader'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const { login } = useAuthStore()

  useEffect(() => {
    authService.refresh()
      .then((res: unknown) => {
        const response = res as { data: { data: { accessToken: string; user: { role: 'TRAINER' | 'CLIENT'; id: string; email: string } } } }
        const { accessToken, user } = response.data.data
        login(accessToken, user.role, user.id, user.email)
      })
      .catch(() => {
        // No hay sesión activa — el guard redirigirá
      })
      .finally(() => setIsLoading(false))
  }, [login])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <Loader size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
