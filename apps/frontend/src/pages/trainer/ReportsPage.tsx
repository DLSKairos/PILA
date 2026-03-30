import { useEffect, useState } from 'react'
import { trainerService } from '@/services/trainer.service'
import { Card, Badge, Loader } from '@/components/ui'
import { formatDate } from '@/utils/format.util'

interface ClientReport {
  clientId: string
  clientName: string
  weekStart: string
  weekEnd: string
  adherence: number
  aiSummary?: string
  mealsCompleted: number
  workoutsCompleted: number
}

interface AIUsageEntry {
  date: string
  endpoint: string
  tokens: number
  costUsd: number
}

interface ReportData {
  weeklyReports?: ClientReport[]
  clients?: ClientReport[]
  totalClients?: number
  avgAdherence?: number
  aiCostThisWeek?: number
  aiCostThisMonth?: number
  aiUsage?: AIUsageEntry[]
  needsAttention?: Array<{ clientId: string; name: string; adherence: number; daysMissed: number }>
}

function getAdherenceColor(adherence: number): string {
  if (adherence >= 70) return 'var(--green)'
  if (adherence >= 40) return '#EAB308'
  return 'var(--red)'
}

function getAdherenceVariant(adherence: number): 'success' | 'warning' | 'error' {
  if (adherence >= 70) return 'success'
  if (adherence >= 40) return 'warning'
  return 'error'
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trainerService.getLatestReport()
      .then(res => setReportData((res.data as any).data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader size="lg" />
      </div>
    )
  }

  const weeklyReports: ClientReport[] = reportData?.weeklyReports ?? reportData?.clients ?? []
  const aiUsage: AIUsageEntry[] = reportData?.aiUsage ?? []

  return (
    <div style={{ padding: '24px 20px' }}>
      <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, color: 'var(--txt)', letterSpacing: 1, marginBottom: 20 }}>
        REPORTES
      </h1>

      {/* Stats globales */}
      {reportData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: 'var(--orange)', lineHeight: 1 }}>
              {reportData.totalClients ?? weeklyReports.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Clientes activos</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: 'var(--txt)', lineHeight: 1 }}>
              {reportData.avgAdherence ?? 0}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Adherencia prom.</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 26, color: 'var(--txt)', lineHeight: 1 }}>
              ${(reportData.aiCostThisWeek ?? 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Costo IA semana</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 26, color: 'var(--txt)', lineHeight: 1 }}>
              ${(reportData.aiCostThisMonth ?? 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>Costo IA mes</div>
          </Card>
        </div>
      )}

      {/* Alertas */}
      {reportData?.needsAttention && reportData.needsAttention.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: 'var(--red)', marginBottom: 10, letterSpacing: 1 }}>
            NECESITAN ATENCIÓN
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportData.needsAttention.map(c => (
              <Card key={c.clientId} style={{ borderLeft: '3px solid var(--red)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', margin: 0 }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: '2px 0 0' }}>
                      {c.daysMissed} días sin registrar
                    </p>
                  </div>
                  <Badge variant="error">{c.adherence}%</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reportes por cliente */}
      <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: 'var(--txt)', marginBottom: 10, letterSpacing: 1 }}>
        REPORTES SEMANALES
      </h2>

      {weeklyReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
          <p style={{ fontSize: 14 }}>No hay reportes disponibles aún</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Los reportes se generan automáticamente cada semana</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {weeklyReports.map((report, index) => (
            <Card key={`${report.clientId}-${index}`} style={{ borderLeft: `3px solid ${getAdherenceColor(report.adherence)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', margin: 0 }}>{report.clientName}</p>
                  {report.weekStart && report.weekEnd && (
                    <p style={{ fontSize: 11, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace', margin: '2px 0 0' }}>
                      {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
                    </p>
                  )}
                </div>
                <Badge variant={getAdherenceVariant(report.adherence)}>
                  {report.adherence}% adherencia
                </Badge>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: report.aiSummary ? 8 : 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: 'var(--txt)', fontWeight: 600 }}>
                    {report.mealsCompleted}
                  </span>
                  <p style={{ fontSize: 10, color: 'var(--txt-sub)', margin: '2px 0 0' }}>comidas</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: 'var(--txt)', fontWeight: 600 }}>
                    {report.workoutsCompleted}
                  </span>
                  <p style={{ fontSize: 10, color: 'var(--txt-sub)', margin: '2px 0 0' }}>entrenam.</p>
                </div>
              </div>

              {report.aiSummary && (
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  color: 'var(--txt-sub)',
                  lineHeight: 1.5,
                  borderLeft: '2px solid var(--orange)',
                }}>
                  <span style={{ color: 'var(--orange)', fontWeight: 600, fontSize: 10, letterSpacing: 1 }}>RESUMEN IA  </span>
                  {report.aiSummary}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Tabla uso IA */}
      {aiUsage.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: 'var(--txt)', marginBottom: 12, letterSpacing: 1 }}>
            USO DE IA ESTE MES
          </h2>
          <Card padding="sm">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr 1fr',
              gap: 8,
              padding: '6px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: 10,
              color: 'var(--txt-sub)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              <span>Fecha</span>
              <span>Endpoint</span>
              <span style={{ textAlign: 'right' }}>Tokens</span>
              <span style={{ textAlign: 'right' }}>Costo</span>
            </div>
            {aiUsage.map((entry, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr',
                gap: 8,
                padding: '7px 0',
                borderBottom: i < aiUsage.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: 12,
              }}>
                <span style={{ fontFamily: '"DM Mono", monospace', color: 'var(--txt-sub)', fontSize: 11 }}>
                  {entry.date?.slice(5, 10)}
                </span>
                <span style={{ color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.endpoint}
                </span>
                <span style={{ fontFamily: '"DM Mono", monospace', color: 'var(--txt)', textAlign: 'right' }}>
                  {entry.tokens.toLocaleString()}
                </span>
                <span style={{ fontFamily: '"DM Mono", monospace', color: 'var(--orange)', textAlign: 'right' }}>
                  ${entry.costUsd.toFixed(3)}
                </span>
              </div>
            ))}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr 1fr',
              gap: 8,
              padding: '8px 0 0',
              borderTop: '2px solid var(--border)',
              marginTop: 4,
              fontWeight: 700,
              fontSize: 12,
            }}>
              <span></span>
              <span style={{ color: 'var(--txt)' }}>TOTAL</span>
              <span style={{ fontFamily: '"DM Mono", monospace', color: 'var(--txt)', textAlign: 'right' }}>
                {aiUsage.reduce((sum, e) => sum + e.tokens, 0).toLocaleString()}
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', color: 'var(--orange)', textAlign: 'right' }}>
                ${aiUsage.reduce((sum, e) => sum + e.costUsd, 0).toFixed(3)}
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
