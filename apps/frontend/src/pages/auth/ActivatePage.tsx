import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { PATHS } from '@/router/paths'

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
  }, [token, navigate])

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
          ¡Bienvenido! Crea tu contraseña para empezar
        </p>
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
