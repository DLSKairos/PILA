import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PATHS } from '@/router/paths'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword(token!, password)
      setSuccess(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message ?? 'Token inválido o expirado')
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
          letterSpacing: 4, textAlign: 'center', marginBottom: 32,
        }}>PILA</div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: 'var(--txt)', fontWeight: 600, marginBottom: 8, margin: '0 0 8px' }}>Contraseña actualizada</h2>
            <Link to={PATHS.LOGIN} style={{ color: 'var(--orange)', fontSize: 14, textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ color: 'var(--txt)', fontWeight: 600, margin: '0 0 4px' }}>Nueva contraseña</h2>
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
            {error && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>}
            <Button type="submit" fullWidth loading={loading}>Restablecer contraseña</Button>
          </form>
        )}
      </div>
    </div>
  )
}
