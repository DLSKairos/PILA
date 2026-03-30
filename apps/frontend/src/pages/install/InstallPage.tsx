import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isPWA, getOS, isIOSSafari, isDesktop } from '@/utils/pwa.util'
import { useAppStore } from '@/stores/app.store'
import { Button } from '@/components/ui/Button'
import { PATHS } from '@/router/paths'

export default function InstallPage() {
  const navigate = useNavigate()
  const { deferredPrompt, triggerInstall } = useAppStore()

  useEffect(() => {
    if (isDesktop()) {
      navigate(PATHS.LOGIN, { replace: true })
    }
  }, [navigate])

  // Desktop → useEffect maneja la redirección
  if (isDesktop()) return null

  // Ya instalada como PWA
  if (isPWA()) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 72, color: 'var(--orange)', letterSpacing: 4, marginBottom: 16 }}>PILA</div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: 'var(--txt)', fontWeight: 600, marginBottom: 8, margin: '0 0 8px' }}>Ya tienes PILA instalada</h2>
        <p style={{ color: 'var(--txt-sub)', fontSize: 14, margin: 0 }}>Ábrela desde tu pantalla de inicio</p>
        <div style={{ marginTop: 40, fontSize: 32, animation: 'pulse 2s ease infinite' }}>⬇️</div>
      </div>
    )
  }

  const os = getOS()

  // Android con deferredPrompt
  if (os === 'android') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 72, color: 'var(--orange)', letterSpacing: 4, marginBottom: 8 }}>PILA</div>
        <p style={{ color: 'var(--txt-sub)', fontSize: 14, marginBottom: 48 }}>El gym en tu bolsillo, el cambio en tu vida</p>
        <Button
          size="lg"
          fullWidth
          onClick={() => { void triggerInstall() }}
          disabled={!deferredPrompt}
          style={{ maxWidth: 320, fontSize: 18 }}
        >
          Instalar PILA
        </Button>
        <p style={{ color: 'var(--txt-sub)', fontSize: 12, marginTop: 16 }}>
          Se instala como una app nativa, sin App Store
        </p>
      </div>
    )
  }

  // iOS Safari → instrucciones paso a paso
  if (isIOSSafari()) {
    const steps = [
      { icon: '⬆️', text: 'Toca el botón compartir en la barra de Safari' },
      { icon: '📲', text: 'Selecciona "Añadir a pantalla de inicio"' },
      { icon: '✅', text: 'Toca "Añadir"' },
      { icon: '🎉', text: 'Abre PILA desde tu pantalla de inicio' },
    ]
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}>
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif', fontSize: 72, color: 'var(--orange)',
          letterSpacing: 4, textAlign: 'center', marginBottom: 8,
        }}>PILA</div>
        <p style={{ color: 'var(--txt-sub)', fontSize: 14, textAlign: 'center', marginBottom: 40 }}>
          Instala PILA en tu iPhone para la mejor experiencia
        </p>
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '14px 16px',
            }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <span style={{ fontSize: 12, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace' }}>
                  Paso {i + 1}
                </span>
                <p style={{ fontSize: 14, color: 'var(--txt)', margin: '2px 0 0' }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 40, padding: '12px 20px',
          background: 'var(--orange-dim)', border: '1px solid var(--orange)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, color: 'var(--orange)', margin: 0 }}>
            💡 El botón compartir ⬆️ está en la barra inferior de Safari
          </p>
        </div>
      </div>
    )
  }

  // iOS pero no Safari → pedir abrir en Safari
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{
        fontFamily: '"Bebas Neue", sans-serif', fontSize: 72, color: 'var(--orange)',
        letterSpacing: 4, marginBottom: 40,
      }}>PILA</div>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
      <h2 style={{ color: 'var(--txt)', fontWeight: 600, marginBottom: 8, margin: '0 0 8px' }}>Para instalar PILA</h2>
      <p style={{ color: 'var(--txt-sub)', fontSize: 14, marginBottom: 32 }}>
        Abre este link en Safari para poder instalar la app
      </p>
      <Button onClick={() => { void navigator.clipboard.writeText(window.location.href) }}>
        Copiar link
      </Button>
    </div>
  )
}
