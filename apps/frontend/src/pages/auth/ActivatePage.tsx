import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
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

export default function ActivatePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) navigate(PATHS.LOGIN)
    // Mostrar errores que vienen del callback de Google
    const googleError = searchParams.get('error')
    if (googleError) setError(decodeURIComponent(googleError))
  }, [token, navigate, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8) {
      setError('Mínimo 8 caracteres')
      return
    }
    if (!terms) {
      setError('Debes aceptar los términos y condiciones')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authService.activateClient(token!, password)
      const { accessToken, user } = (res.data as { data: { accessToken: string; user: { role: 'TRAINER' | 'CLIENT'; id: string; email: string } } }).data
      login(accessToken, user.role, user.id, user.email)
      navigate(PATHS.CLIENT.ONBOARDING, { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message ?? 'Token inválido o expirado. Contacta a tu entrenador.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleActivate = () => {
    if (!token) return
    window.location.href = `${API_URL}/api/v1/auth/google/client?invitationToken=${encodeURIComponent(token)}`
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif', fontSize: 56, color: 'var(--orange)',
          letterSpacing: 4, textAlign: 'center', marginBottom: 8,
        }}>PILA</div>
        <p style={{ textAlign: 'center', color: 'var(--txt-sub)', fontSize: 14, marginBottom: 32 }}>
          ¡Bienvenido! Activa tu cuenta para empezar
        </p>

        {/* Botón Google */}
        <button
          onClick={handleGoogleActivate}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '11px 16px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'var(--card)',
            color: 'var(--txt)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            fontFamily: '"DM Sans", sans-serif', marginBottom: 16,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover, var(--border))')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
        >
          <GoogleIcon />
          Activar con Google
        </button>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--txt-sub)', fontSize: 12 }}>o crea una contraseña</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <Checkbox
            checked={terms}
            onChange={setTerms}
            label="Acepto los términos y condiciones (Ley 1581 de protección de datos)"
          />
          {error && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>}
          <Button type="submit" fullWidth loading={loading} size="lg">Activar cuenta</Button>
        </form>
      </div>
    </div>
  )
}
