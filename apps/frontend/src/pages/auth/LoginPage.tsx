import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { useTrainerStore } from '@/stores/trainer.store'
import { trainerService } from '@/services/trainer.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PATHS } from '@/router/paths'

export default function LoginPage() {
  const [tab, setTab] = useState<'TRAINER' | 'CLIENT'>('TRAINER')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const setProfile = useTrainerStore(s => s.setProfile)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = tab === 'TRAINER'
        ? await authService.loginTrainer(email, password)
        : await authService.loginClient(email, password)

      const { accessToken, user } = (res.data as { data: { accessToken: string; user: { role: 'TRAINER' | 'CLIENT'; id: string; email: string } } }).data
      login(accessToken, user.role, user.id, user.email)

      if (tab === 'TRAINER') {
        try {
          const profileRes = await trainerService.getProfile()
          setProfile((profileRes.data as { data: Parameters<typeof setProfile>[0] }).data)
        } catch {
          // Perfil cargará más adelante
        }
        navigate(PATHS.TRAINER.DASHBOARD, { replace: true })
      } else {
        navigate(PATHS.CLIENT.HOME, { replace: true })
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } }
      const msg = axiosErr.response?.data?.message ?? 'Credenciales incorrectas'
      setError(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 56, color: 'var(--orange)', letterSpacing: 4 }}>PILA</div>
        <div style={{ fontSize: 13, color: 'var(--txt-sub)', marginTop: -4 }}>El gym en tu bolsillo</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', marginBottom: 20, padding: 4,
        }}>
          {(['TRAINER', 'CLIENT'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius-md)', border: 'none',
                background: tab === t ? 'var(--orange)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--txt-sub)',
                cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {t === 'TRAINER' ? 'Entrenador' : 'Cliente'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}

          <Button type="submit" fullWidth loading={loading} size="lg">
            Iniciar sesión
          </Button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to={PATHS.FORGOT_PASSWORD} style={{ color: 'var(--txt-sub)', fontSize: 13, textDecoration: 'none' }}>
            ¿Olvidaste tu contraseña?
          </Link>
          {tab === 'TRAINER' && (
            <Link to={PATHS.REGISTER} style={{ color: 'var(--orange)', fontSize: 13, textDecoration: 'none' }}>
              ¿No tienes cuenta? Regístrate
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
