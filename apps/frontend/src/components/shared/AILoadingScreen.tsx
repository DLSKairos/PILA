import { useState, useEffect } from 'react'
import { Loader } from '@/components/ui/Loader'

interface AILoadingScreenProps {
  isVisible: boolean
  clientName?: string
  done?: boolean
  error?: string
  onRetry?: () => void
}

const STEPS = [
  'Analizando perfil',
  'Calculando calorías',
  'Generando comidas',
  'Ajustando macros',
  'Escribiendo recetas',
]

export function AILoadingScreen({ isVisible, clientName, done, error, onRetry }: AILoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0)
      return
    }
    if (done) {
      setCurrentStep(STEPS.length)
      return
    }
    const interval = setInterval(() => {
      setCurrentStep(s => {
        if (s >= STEPS.length - 1) {
          clearInterval(interval)
          return s
        }
        return s + 1
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [isVisible, done])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(8,8,8,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 48,
        color: 'var(--orange)',
        letterSpacing: 4,
        marginBottom: 8,
        animation: 'pulse 2s ease infinite',
      }}>
        PILA
      </div>
      {clientName && (
        <p style={{ color: 'var(--txt-sub)', fontSize: 14, marginBottom: 40 }}>
          Generando plan para {clientName}
        </p>
      )}

      {error ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--red)', marginBottom: 16 }}>Algo salió mal. Intenta de nuevo.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                color: 'var(--orange)',
                background: 'none',
                border: '1px solid var(--orange)',
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, flexShrink: 0, textAlign: 'center' }}>
                  {i < currentStep ? '✓' : i === currentStep ? <Loader size="sm" /> : '○'}
                </span>
                <span style={{
                  fontSize: 14,
                  color: i <= currentStep ? 'var(--txt)' : 'var(--txt-dim)',
                  transition: 'color 0.3s',
                }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--txt-dim)', textAlign: 'center' }}>
            Esto puede tomar unos segundos — vale la pena 💪
          </p>
        </>
      )}
    </div>
  )
}
