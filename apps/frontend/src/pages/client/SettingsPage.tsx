import { useState, type ReactNode, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/hooks/useTheme'
import { useLang } from '@/hooks/useLang'
import { authService } from '@/services/auth.service'
import { Card, Button, Input } from '@/components/ui'
import { PATHS } from '@/router/paths'

interface PasswordForm {
  current: string
  newPw: string
  confirm: string
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--txt-dim)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function ClientSettingsPage() {
  const { theme, changeTheme } = useTheme()
  const { language, changeLang } = useLang()
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const [pwForm, setPwForm] = useState<PasswordForm>({ current: '', newPw: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // silent
    }
    logout()
    navigate(PATHS.LOGIN, { replace: true })
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('Las contraseñas no coinciden')
      return
    }
    if (pwForm.newPw.length < 8) {
      setPwError('Mínimo 8 caracteres')
      return
    }
    setPwLoading(true)
    setPwError('')
    setPwSuccess(false)
    try {
      await authService.changePassword(pwForm.current, pwForm.newPw)
      setPwSuccess(true)
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setPwError(axiosErr.response?.data?.message ?? 'Error al cambiar contraseña')
    } finally {
      setPwLoading(false)
    }
  }

  const themeOptions: Array<['dark' | 'light' | 'system', string]> = [
    ['dark', '🌙 Oscuro'],
    ['light', '☀️ Claro'],
    ['system', '⚙️ Sistema'],
  ]

  const langOptions: Array<['es' | 'en' | 'system', string]> = [
    ['es', '🇨🇴 Español'],
    ['en', '🇺🇸 English'],
    ['system', '⚙️ Sistema'],
  ]

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      <h1 style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 32,
        color: 'var(--txt)',
        marginBottom: 24,
      }}>
        CONFIGURACIÓN
      </h1>

      <Section title="Apariencia">
        <Card>
          <p style={{ fontSize: 13, color: 'var(--txt-sub)', marginBottom: 10 }}>Tema</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {themeOptions.map(([val, label]) => (
              <button
                key={val}
                onClick={() => changeTheme(val)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${theme === val ? 'var(--orange)' : 'var(--border)'}`,
                  background: theme === val ? 'var(--orange-dim)' : 'transparent',
                  color: theme === val ? 'var(--orange)' : 'var(--txt-sub)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Idioma">
        <Card>
          <div style={{ display: 'flex', gap: 8 }}>
            {langOptions.map(([val, label]) => (
              <button
                key={val}
                onClick={() => changeLang(val)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${language === val ? 'var(--orange)' : 'var(--border)'}`,
                  background: language === val ? 'var(--orange-dim)' : 'transparent',
                  color: language === val ? 'var(--orange)' : 'var(--txt-sub)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Seguridad">
        <Card>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', marginBottom: 4 }}>
              Cambiar contraseña
            </p>
            <Input
              label="Contraseña actual"
              type="password"
              value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              required
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
              required
            />
            <Input
              label="Confirmar"
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              required
            />
            {pwError && <p style={{ color: 'var(--red)', fontSize: 12 }}>{pwError}</p>}
            {pwSuccess && <p style={{ color: 'var(--green)', fontSize: 12 }}>✓ Contraseña actualizada</p>}
            <Button type="submit" loading={pwLoading}>Actualizar contraseña</Button>
          </form>
        </Card>
      </Section>

      <Section title="Cuenta">
        <Card>
          <Button variant="danger" fullWidth onClick={handleLogout}>Cerrar sesión</Button>
        </Card>
      </Section>
    </div>
  )
}
