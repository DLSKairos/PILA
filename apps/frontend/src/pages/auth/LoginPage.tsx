import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { useTrainerStore } from '@/stores/trainer.store'
import { trainerService } from '@/services/trainer.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PATHS } from '@/router/paths'

const API_URL = import.meta.env.VITE_API_URL as string

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const [tab, setTab] = useState<'TRAINER' | 'CLIENT'>('TRAINER')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore(s => s.login)
  const setProfile = useTrainerStore(s => s.setProfile)

  // Mostrar errores que vienen del callback de Google
  useEffect(() => {
    const googleError = searchParams.get('googleError')
    if (googleError) setError(decodeURIComponent(googleError))
  }, [searchParams])

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
        } catch { /* cargará después */ }
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

  const googleLoginUrl = `${API_URL}/api/v1/auth/google/${tab === 'TRAINER' ? 'trainer' : 'client'}`

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
              onClick={() => { setTab(t); setError('') }}
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

        {/* Botón Google — usa <a> para que funcione en PWA */}
        <a
          href={googleLoginUrl}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '11px 16px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'var(--card)',
            color: 'var(--txt)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            fontFamily: '"DM Sans", sans-serif', marginBottom: 16,
            textDecoration: 'none', boxSizing: 'border-box',
          }}
        >
          <GoogleIcon />
          Continuar con Google
        </a>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--txt-sub)', fontSize: 12 }}>o con correo</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
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
