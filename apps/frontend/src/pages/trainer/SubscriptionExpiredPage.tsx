import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrainerStore } from '@/stores/trainer.store'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui'
import { PATHS } from '@/router/paths'

interface Plan {
  name: 'STARTER' | 'PRO' | 'ELITE'
  price: string
  clients: string
  ai: string
  highlighted?: boolean
}

const PLANS: Plan[] = [
  { name: 'STARTER', price: '$29.900', clients: '10 clientes', ai: '5 planes IA/mes' },
  { name: 'PRO', price: '$59.900', clients: '40 clientes', ai: '15 planes IA/mes', highlighted: true },
  { name: 'ELITE', price: '$99.900', clients: 'Ilimitados', ai: 'IA ilimitada' },
]

export default function SubscriptionExpiredPage() {
  const profile = useTrainerStore(s => s.profile)
  const clearTrainer = useTrainerStore(s => s.clear)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ELITE'>('PRO')

  const handleContact = () => {
    const name = profile ? `${profile.firstName} ${profile.lastName}` : 'un entrenador'
    const msg = encodeURIComponent(`Hola, soy ${name}, quiero activar mi plan ${selectedPlan} en PILA`)
    window.open(`https://wa.me/573000000000?text=${msg}`, '_blank')
  }

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    clearTrainer()
    navigate(PATHS.LOGIN)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 48,
        color: 'var(--orange)',
        letterSpacing: 6,
        marginBottom: 8,
      }}>
        PILA
      </div>

      {/* Icono */}
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>

      {/* Mensaje principal */}
      <h1 style={{
        fontWeight: 700,
        fontSize: 22,
        color: 'var(--txt)',
        marginBottom: 8,
        textAlign: 'center',
        maxWidth: 360,
      }}>
        Tu período de prueba terminó
      </h1>
      <p style={{
        color: 'var(--txt-sub)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
        maxWidth: 320,
        lineHeight: 1.6,
      }}>
        Todos tus clientes y planes siguen guardados.
        Solo activa un plan para continuar entrenando.
      </p>

      {/* Beneficio de datos guardados */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginBottom: 28,
        width: '100%',
        maxWidth: 340,
      }}>
        {[
          '✓ Tus clientes siguen en la plataforma',
          '✓ Sus planes nutricionales están guardados',
          '✓ El historial de progreso se conserva',
        ].map(item => (
          <p key={item} style={{ fontSize: 13, color: 'var(--txt-sub)', margin: 0 }}>{item}</p>
        ))}
      </div>

      {/* Planes */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {PLANS.map(plan => {
          const isSelected = selectedPlan === plan.name
          return (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelectedPlan(plan.name)}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                border: `2px solid ${isSelected ? 'var(--orange)' : 'var(--border)'}`,
                background: isSelected ? 'var(--orange-dim)' : 'var(--card)',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {plan.highlighted && (
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--orange)',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1,
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                }}>
                  POPULAR
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 22,
                    color: isSelected ? 'var(--orange)' : 'var(--txt)',
                    letterSpacing: 2,
                  }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--txt-sub)', marginTop: 2 }}>
                    {plan.clients} · {plan.ai}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: 18,
                    color: 'var(--txt)',
                    fontWeight: 700,
                  }}>
                    {plan.price}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-sub)' }}>/mes</div>
                </div>
              </div>
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 16,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: '#fff',
                  fontWeight: 700,
                }}>
                  ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <Button
        fullWidth
        size="lg"
        onClick={handleContact}
        style={{ maxWidth: 360, marginBottom: 10 }}
      >
        💬 Contactar para activar
      </Button>

      <p style={{
        fontSize: 11,
        color: 'var(--txt-sub)',
        marginBottom: 24,
        textAlign: 'center',
      }}>
        En breve podrás pagar directamente aquí
      </p>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          color: 'var(--txt-sub)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: '"DM Sans", sans-serif',
          textDecoration: 'underline',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
