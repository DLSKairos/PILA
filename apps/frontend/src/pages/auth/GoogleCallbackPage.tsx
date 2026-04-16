import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useTrainerStore } from '@/stores/trainer.store'
import { trainerService } from '@/services/trainer.service'
import { Loader } from '@/components/ui/Loader'
import { PATHS } from '@/router/paths'

/**
 * Página intermedia que recibe el redirect de Google OAuth desde el backend.
 * El backend redirige a:  /auth/google/callback?at=<accessToken>&id=<userId>&email=<email>&role=<role>
 *
 * Guarda el token en Zustand y redirige al dashboard correspondiente.
 * Si hay error, muestra el mensaje y redirige al login.
 */
export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const setProfile = useTrainerStore(s => s.setProfile)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const at = searchParams.get('at')
    const id = searchParams.get('id')
    const email = searchParams.get('email')
    const role = searchParams.get('role') as 'TRAINER' | 'CLIENT' | null
    const error = searchParams.get('error')

    if (error || !at || !id || !email || !role) {
      const msg = error ? decodeURIComponent(error) : 'Error al autenticar con Google'
      navigate(`${PATHS.LOGIN}?googleError=${encodeURIComponent(msg)}`, { replace: true })
      return
    }

    login(at, role, id, email)

    if (role === 'TRAINER') {
      trainerService.getProfile()
        .then((res: any) => setProfile(res.data.data))
        .catch(() => {})
        .finally(() => navigate(PATHS.TRAINER.DASHBOARD, { replace: true }))
    } else {
      navigate(PATHS.CLIENT.HOME, { replace: true })
    }
  }, [searchParams, navigate, login, setProfile])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      gap: 16,
    }}>
      <Loader size="lg" />
      <p style={{ color: 'var(--txt-sub)', fontSize: 14 }}>Autenticando con Google...</p>
    </div>
  )
}
