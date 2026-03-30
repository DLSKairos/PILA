import { useTrainerStore } from '@/stores/trainer.store'
import { Card, Button, Badge, ProgressBar } from '@/components/ui'

const PLAN_FEATURES: Record<string, { clients: string; ai: string; color: string }> = {
  STARTER: { clients: 'Hasta 10 clientes', ai: '5 planes IA/mes', color: 'var(--txt)' },
  PRO: { clients: 'Hasta 40 clientes', ai: '15 planes IA/mes', color: 'var(--orange)' },
  ELITE: { clients: 'Clientes ilimitados', ai: 'IA ilimitada', color: 'var(--green)' },
}

const PLAN_PRICES: Record<string, string> = {
  STARTER: '$29.900/mes',
  PRO: '$59.900/mes',
  ELITE: '$99.900/mes',
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  TRIAL: { label: 'Período de prueba', variant: 'warning' },
  ACTIVE: { label: 'Activo', variant: 'success' },
  EXPIRED: { label: 'Expirado', variant: 'error' },
  CANCELLED: { label: 'Cancelado', variant: 'neutral' },
}

export default function SubscriptionPage() {
  const subscription = useTrainerStore(s => s.subscription)
  const profile = useTrainerStore(s => s.profile)

  const handleContactWhatsApp = () => {
    const name = profile ? `${profile.firstName} ${profile.lastName}` : 'un entrenador'
    const plan = subscription?.plan ?? 'PRO'
    const msg = encodeURIComponent(`Hola, soy ${name}, quiero cambiar mi plan a ${plan} en PILA`)
    window.open(`https://wa.me/573000000000?text=${msg}`, '_blank')
  }

  const currentPlan = subscription?.plan ?? 'STARTER'
  const statusInfo = STATUS_LABELS[subscription?.status ?? 'TRIAL']

  return (
    <div style={{ padding: '24px 20px' }}>
      <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, color: 'var(--txt)', letterSpacing: 1, marginBottom: 20 }}>
        SUSCRIPCIÓN
      </h1>

      {/* Plan actual */}
      <Card style={{ marginBottom: 16, borderLeft: '3px solid var(--orange)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: '0 0 4px' }}>Plan actual</p>
            <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: 'var(--orange)', letterSpacing: 2, margin: 0 }}>
              {currentPlan}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--txt-sub)', margin: '4px 0 0' }}>
              {PLAN_PRICES[currentPlan]}
            </p>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {subscription?.status === 'TRIAL' && subscription.trialEndsAt && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(234,179,8,0.08)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            color: '#EAB308',
            marginBottom: 8,
          }}>
            Tu período de prueba termina el {subscription.trialEndsAt.slice(0, 10)}
          </div>
        )}

        {subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd && (
          <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: '4px 0 0', fontFamily: '"DM Mono", monospace' }}>
            Próxima renovación: {subscription.currentPeriodEnd.slice(0, 10)}
          </p>
        )}
      </Card>

      {/* Contadores */}
      {subscription && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', marginBottom: 14 }}>Uso actual</h3>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--txt)' }}>Clientes activos</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, color: 'var(--txt)' }}>
                {subscription.clientsCount} / {subscription.clientsLimit === -1 ? '∞' : subscription.clientsLimit}
              </span>
            </div>
            {subscription.clientsLimit !== -1 && (
              <ProgressBar
                value={subscription.clientsCount}
                max={subscription.clientsLimit}
                height={6}
                color={subscription.clientsCount >= subscription.clientsLimit * 0.9 ? 'var(--red)' : 'var(--orange)'}
              />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--txt)' }}>Planes IA este mes</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, color: 'var(--txt)' }}>
                {subscription.aiPlansUsed} / {subscription.aiPlansLimit === -1 ? '∞' : subscription.aiPlansLimit}
              </span>
            </div>
            {subscription.aiPlansLimit !== -1 && (
              <ProgressBar
                value={subscription.aiPlansUsed}
                max={subscription.aiPlansLimit}
                height={6}
                color={subscription.aiPlansUsed >= subscription.aiPlansLimit * 0.9 ? 'var(--red)' : 'var(--orange)'}
              />
            )}
          </div>
        </Card>
      )}

      {/* Comparativa de planes */}
      <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: 'var(--txt)', marginBottom: 12, letterSpacing: 1 }}>
        PLANES DISPONIBLES
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {(['STARTER', 'PRO', 'ELITE'] as const).map(plan => {
          const features = PLAN_FEATURES[plan]
          const isCurrent = plan === currentPlan
          return (
            <Card
              key={plan}
              style={{
                border: `2px solid ${isCurrent ? 'var(--orange)' : 'var(--border)'}`,
                background: isCurrent ? 'var(--orange-dim)' : 'var(--card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: 22,
                      color: isCurrent ? 'var(--orange)' : features.color,
                      letterSpacing: 2,
                      margin: 0,
                    }}>
                      {plan}
                    </h3>
                    {isCurrent && <Badge variant="orange">Tu plan</Badge>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: '4px 0 0' }}>
                    {features.clients} · {features.ai}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 16, color: 'var(--txt)', fontWeight: 700, margin: 0 }}>
                    {PLAN_PRICES[plan].split('/')[0]}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--txt-sub)', margin: '2px 0 0' }}>/mes</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* CTA */}
      <Button fullWidth size="lg" onClick={handleContactWhatsApp}>
        💬 Contactar para cambiar plan
      </Button>
      <p style={{ fontSize: 11, color: 'var(--txt-sub)', textAlign: 'center', marginTop: 10 }}>
        En breve podrás gestionar tu suscripción directamente aquí
      </p>
    </div>
  )
}
