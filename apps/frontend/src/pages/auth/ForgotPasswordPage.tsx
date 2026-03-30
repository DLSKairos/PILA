import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PATHS } from '@/router/paths'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'TRAINER' | 'CLIENT'>('TRAINER')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.forgotPassword(email, role)
      setSent(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message ?? 'Error al enviar el correo')
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

        {sent ? (
          <div style={{ textAlign: 'center', color: 'var(--txt)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontWeight: 600, marginBottom: 8, margin: '0 0 8px' }}>Revisa tu correo</h2>
            <p style={{ color: 'var(--txt-sub)', fontSize: 14, margin: '0 0 24px' }}>
              Te enviamos las instrucciones a <strong>{email}</strong>
            </p>
            <Link to={PATHS.LOGIN} style={{ display: 'inline-block', color: 'var(--orange)', fontSize: 14, textDecoration: 'none' }}>
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ color: 'var(--txt)', fontWeight: 600, margin: '0 0 4px' }}>Recuperar contraseña</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['TRAINER', 'CLIENT'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${role === r ? 'var(--orange)' : 'var(--border)'}`,
                    background: role === r ? 'var(--orange-dim)' : 'transparent',
                    color: role === r ? 'var(--orange)' : 'var(--txt-sub)',
                    cursor: 'pointer', fontSize: 13, fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {r === 'TRAINER' ? 'Entrenador' : 'Cliente'}
                </button>
              ))}
            </div>
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>}
            <Button type="submit" fullWidth loading={loading}>Enviar link de recuperación</Button>
            <Link to={PATHS.LOGIN} style={{ textAlign: 'center', color: 'var(--txt-sub)', fontSize: 13, textDecoration: 'none' }}>
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
