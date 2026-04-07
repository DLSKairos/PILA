import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trainerService } from '@/services/trainer.service'
import { authService } from '@/services/auth.service'
import { useTrainerStore } from '@/stores/trainer.store'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/hooks/useTheme'
import { useLang } from '@/hooks/useLang'
import { Card, Button, Input, Avatar } from '@/components/ui'
import { PATHS } from '@/router/paths'

type Section = 'profile' | 'appearance' | 'language' | 'security' | 'account'

const SECTION_LABELS: { key: Section; label: string; icon: string }[] = [
  { key: 'profile', label: 'Perfil', icon: '👤' },
  { key: 'appearance', label: 'Apariencia', icon: '🎨' },
  { key: 'language', label: 'Idioma', icon: '🌐' },
  { key: 'security', label: 'Seguridad', icon: '🔒' },
  { key: 'account', label: 'Cuenta', icon: '⚙️' },
]

export default function TrainerSettingsPage() {
  const navigate = useNavigate()
  const profile = useTrainerStore(s => s.profile)
  const setProfile = useTrainerStore(s => s.setProfile)
  const clearTrainer = useTrainerStore(s => s.clear)
  const logout = useAuthStore(s => s.logout)
  const { theme, changeTheme } = useTheme()
  const { language, changeLang } = useLang()

  const [section, setSection] = useState<Section>('profile')

  // Perfil
  const nameParts = profile?.name?.split(' ') ?? []
  const [profileForm, setProfileForm] = useState({
    firstName: nameParts[0] ?? '',
    lastName: nameParts.slice(1).join(' ') ?? '',
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Seguridad
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    setProfileSuccess(false)
    try {
      const res = await trainerService.updateProfile(profileForm)
      const updated = (res.data as any).data
      if (updated && profile) {
        setProfile({ ...profile, ...updated })
      }
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setProfileError(err.response?.data?.message ?? 'Error al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Las contraseñas no coinciden')
      return
    }
    if (pwForm.next.length < 8) {
      setPwError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setSavingPw(true)
    try {
      await authService.changePassword(pwForm.current, pwForm.next)
      setPwForm({ current: '', next: '', confirm: '' })
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err: any) {
      setPwError(err.response?.data?.message ?? 'Error al cambiar contraseña')
    } finally {
      setSavingPw(false)
    }
  }

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    clearTrainer()
    navigate(PATHS.LOGIN)
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, color: 'var(--txt)', letterSpacing: 1, marginBottom: 20 }}>
        CONFIGURACIÓN
      </h1>

      {/* Navegación de secciones */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, scrollbarWidth: 'none' }}>
        {SECTION_LABELS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${section === s.key ? 'var(--orange)' : 'var(--border)'}`,
              background: section === s.key ? 'var(--orange-dim)' : 'transparent',
              color: section === s.key ? 'var(--orange)' : 'var(--txt-sub)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* PERFIL */}
      {section === 'profile' && (
        <form onSubmit={handleSaveProfile}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar name={profile?.name ?? 'E'} size="xl" />
              <div>
                <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--txt)', margin: 0 }}>
                  {profile?.name}
                </p>
                <p style={{ fontSize: 13, color: 'var(--txt-sub)', margin: '2px 0 0' }}>{profile?.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Nombre"
                  value={profileForm.firstName}
                  onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                  required
                />
                <Input
                  label="Apellido"
                  value={profileForm.lastName}
                  onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
              <Input
                label="Teléfono"
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+57 300 000 0000"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '13px', color: 'var(--txt-sub)', fontWeight: 500 }}>Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Cuéntales a tus clientes sobre ti..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--txt)',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '15px',
                    padding: '10px 12px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </Card>

          {profileError && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{profileError}</p>}
          {profileSuccess && <p style={{ color: 'var(--green)', fontSize: 12, marginBottom: 8 }}>Perfil guardado correctamente</p>}
          <Button type="submit" fullWidth loading={savingProfile}>Guardar perfil</Button>
        </form>
      )}

      {/* APARIENCIA */}
      {section === 'appearance' && (
        <Card>
          <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', marginBottom: 16 }}>Tema</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              { value: 'dark', label: '🌙 Oscuro', desc: 'Interfaz oscura' },
              { value: 'light', label: '☀️ Claro', desc: 'Interfaz clara' },
              { value: 'system', label: '⚙️ Sistema', desc: 'Sigue la preferencia del dispositivo' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => changeTheme(opt.value)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${theme === opt.value ? 'var(--orange)' : 'var(--border)'}`,
                  background: theme === opt.value ? 'var(--orange-dim)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)', margin: 0 }}>{opt.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--txt-sub)', margin: '2px 0 0' }}>{opt.desc}</p>
                </div>
                {theme === opt.value && (
                  <span style={{ color: 'var(--orange)', fontSize: 16 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* IDIOMA */}
      {section === 'language' && (
        <Card>
          <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', marginBottom: 16 }}>Idioma</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              { value: 'es', label: '🇨🇴 Español', desc: 'Interfaz en español' },
              { value: 'en', label: '🇺🇸 English', desc: 'Interface in English' },
              { value: 'system', label: '⚙️ Sistema', desc: 'Sigue el idioma del dispositivo' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => changeLang(opt.value)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${language === opt.value ? 'var(--orange)' : 'var(--border)'}`,
                  background: language === opt.value ? 'var(--orange-dim)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)', margin: 0 }}>{opt.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--txt-sub)', margin: '2px 0 0' }}>{opt.desc}</p>
                </div>
                {language === opt.value && (
                  <span style={{ color: 'var(--orange)', fontSize: 16 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* SEGURIDAD */}
      {section === 'security' && (
        <form onSubmit={handleChangePassword}>
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', marginBottom: 16 }}>Cambiar contraseña</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Contraseña actual"
                type="password"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <Input
                label="Nueva contraseña"
                type="password"
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                required
                autoComplete="new-password"
              />
              <Input
                label="Confirmar nueva contraseña"
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>
          </Card>
          {pwError && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{pwError}</p>}
          {pwSuccess && <p style={{ color: 'var(--green)', fontSize: 12, marginBottom: 8 }}>Contraseña actualizada correctamente</p>}
          <Button type="submit" fullWidth loading={savingPw}>Cambiar contraseña</Button>
        </form>
      )}

      {/* CUENTA */}
      {section === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', marginBottom: 4 }}>Información de cuenta</h3>
            <p style={{ fontSize: 13, color: 'var(--txt-sub)', margin: 0 }}>
              Email: {profile?.email ?? '—'}
            </p>
          </Card>

          <Card>
            <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', marginBottom: 8 }}>Sesión</h3>
            <p style={{ fontSize: 13, color: 'var(--txt-sub)', marginBottom: 14 }}>
              Cierra tu sesión en este dispositivo.
            </p>
            <Button variant="danger" fullWidth onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </Card>

          <Card>
            <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)', marginBottom: 8 }}>Zona de peligro</h3>
            <p style={{ fontSize: 12, color: 'var(--txt-sub)', marginBottom: 14, lineHeight: 1.5 }}>
              Para eliminar tu cuenta o exportar tus datos, contacta a soporte.
            </p>
            <button
              onClick={() => {
                const msg = encodeURIComponent('Hola, necesito soporte con mi cuenta de entrenador en PILA')
                window.open(`https://wa.me/573000000000?text=${msg}`, '_blank')
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--txt-sub)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Contactar soporte
            </button>
          </Card>
        </div>
      )}
    </div>
  )
}
