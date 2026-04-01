import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trainerService } from '@/services/trainer.service'
import { clientsService } from '@/services/clients.service'
import { useTrainerStore } from '@/stores/trainer.store'
import { Card, Avatar, ProgressBar, Badge, Loader } from '@/components/ui'
import { StreakCounter } from '@/components/shared/StreakCounter'
import { PATHS } from '@/router/paths'

interface ClientSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  profile?: { goal?: string; currentWeight?: number; targetWeight?: number }
  streak?: number
  weeklyAdherence?: number
  feedbackPending?: number
}

interface DashboardData {
  clients: ClientSummary[]
  totalClients?: number
  avgAdherence?: number
  needsAttention?: Array<{ clientId: string; name: string; adherence: number; daysMissed: number }>
  aiCostThisWeek?: number
}

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const profile = useTrainerStore(s => s.profile)
  const setProfile = useTrainerStore(s => s.setProfile)
  const setDashboardStats = useTrainerStore(s => s.setDashboardStats)
  const navigate = useNavigate()

  useEffect(() => {
    if (!profile) {
      trainerService.getProfile().then(res => {
        setProfile((res.data as { data: Parameters<typeof setProfile>[0] }).data)
      }).catch(console.error)
    }
  }, [profile, setProfile])

  useEffect(() => {
    Promise.all([trainerService.getDashboard(), trainerService.getLatestReport()])
      .then(async ([dashRes, reportRes]) => {
        const dash = (dashRes.data as any)?.data as DashboardData | undefined
        const report = (reportRes.data as any)?.data

        if (dash) {
          // Si el dashboard no trae clients (array vacío o undefined), hacemos fallback a la lista directa
          let clientList: ClientSummary[] = dash.clients ?? []
          if (clientList.length === 0) {
            try {
              const clientsRes = await clientsService.getAll()
              clientList = (clientsRes.data as any)?.data ?? []
            } catch {
              // fallback silencioso: dejamos array vacío
            }
          }
          setClients(clientList)
          setDashData({ ...dash, clients: clientList })
          setDashboardStats({
            totalClients: dash.totalClients ?? clientList.length,
            activeClients: clientList.length,
            avgAdherence: dash.avgAdherence ?? 0,
            pendingAlerts: dash.needsAttention?.length ?? 0,
            aiCostThisWeek: dash.aiCostThisWeek ?? 0,
          })
        }

        if (report && !dash) {
          setDashData(report)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [setDashboardStats])

  const getTrafficLight = (adherence: number): { color: string; label: string } => {
    if (adherence >= 70) return { color: 'var(--green)', label: '🟢' }
    if (adherence >= 40) return { color: '#EAB308', label: '🟡' }
    return { color: 'var(--red)', label: '🔴' }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = profile?.name?.split(' ')[0] ?? 'Entrenador'

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader size="lg" />
      </div>
    )
  }

  const alertCount = dashData?.needsAttention?.length ?? 0
  const avgAdherence = dashData?.avgAdherence ?? 0
  const totalClients = dashData?.totalClients ?? clients.length
  const aiCost = dashData?.aiCostThisWeek ?? 0

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Saludo */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, color: 'var(--txt)', letterSpacing: 1 }}>
          {greeting}, Entrenador {firstName} 👋
        </h1>
        <p style={{ fontSize: 12, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace' }}>
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: 'var(--orange)', lineHeight: 1 }}>
            {totalClients}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Clientes activos</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: 'var(--txt)', lineHeight: 1 }}>
            {avgAdherence}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Adherencia prom.</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 36,
            color: alertCount > 0 ? 'var(--red)' : 'var(--green)',
            lineHeight: 1,
          }}>
            {alertCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Alertas</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 26, color: 'var(--txt)', lineHeight: 1 }}>
            ${aiCost.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Costo IA semana</div>
        </Card>
      </div>

      {/* Lista clientes */}
      <h2 style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 20,
        color: 'var(--txt)',
        marginBottom: 12,
        letterSpacing: 1,
      }}>
        MIS CLIENTES
      </h2>

      {clients.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>👥</p>
          <p style={{ color: 'var(--txt-sub)', fontSize: 14 }}>Aún no tienes clientes</p>
          <button
            onClick={() => navigate(PATHS.TRAINER.CLIENTS)}
            style={{
              marginTop: 12,
              color: 'var(--orange)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Agregar primer cliente →
          </button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.map(client => {
            const adherence = client.weeklyAdherence ?? 0
            const tl = getTrafficLight(adherence)
            return (
              <Card
                key={client.id}
                onClick={() => navigate(PATHS.TRAINER.CLIENT_DETAIL(client.id))}
                style={{ borderLeft: `3px solid ${tl.color}` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={`${client.firstName} ${client.lastName}`} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)' }}>
                        {client.firstName} {client.lastName}
                      </span>
                      <span style={{ fontSize: 16 }}>{tl.label}</span>
                    </div>
                    {client.profile?.goal && (
                      <p style={{ fontSize: 11, color: 'var(--txt-sub)', marginBottom: 6 }}>
                        {client.profile.goal}
                      </p>
                    )}
                    <ProgressBar value={adherence} max={100} height={4} color={tl.color} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10,
                          color: 'var(--txt-sub)',
                          fontFamily: '"DM Mono", monospace',
                        }}>
                          {adherence}% adherencia
                        </span>
                        {client.streak !== undefined && client.streak > 0 && (
                          <StreakCounter count={client.streak} size="sm" />
                        )}
                      </div>
                      {client.feedbackPending && client.feedbackPending > 0 && (
                        <Badge variant="orange">
                          {client.feedbackPending} feedback
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
