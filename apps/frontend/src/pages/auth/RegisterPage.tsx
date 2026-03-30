import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PATHS } from '@/router/paths'

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const set = (k: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authService.registerTrainer({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      })
      const { accessToken, user } = (res.data as { data: { accessToken: string; user: { role: 'TRAINER' | 'CLIENT'; id: string; email: string } } }).data
      login(accessToken, user.role, user.id, user.email)
      navigate(PATHS.TRAINER.DASHBOARD, { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } }
      const msg = axiosErr.response?.data?.message ?? 'Error al registrarse'
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
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 56, color: 'var(--orange)', letterSpacing: 4 }}>PILA</div>
        <div style={{ fontSize: 13, color: 'var(--txt-sub)' }}>Crea tu cuenta de entrenador</div>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Nombre" value={form.firstName} onChange={set('firstName')} required />
            <Input label="Apellido" value={form.lastName} onChange={set('lastName')} required />
          </div>
          <Input label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required />
          <Input label="Teléfono (opcional)" type="tel" value={form.phone} onChange={set('phone')} />
          <Input label="Contraseña" type="password" value={form.password} onChange={set('password')} required />
          <Input label="Confirmar contraseña" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />

          {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}

          <Button type="submit" fullWidth loading={loading} size="lg">Crear cuenta</Button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to={PATHS.LOGIN} style={{ color: 'var(--txt-sub)', fontSize: 13, textDecoration: 'none' }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
