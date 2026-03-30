import { useEffect, useState } from 'react'
import { progressService } from '@/services/progress.service'
import { Card, Button, Input, Loader } from '@/components/ui'
import { StreakCounter } from '@/components/shared/StreakCounter'
import { formatDate } from '@/utils/format.util'
import type { WeightCheckin, StreakData, AdherenceData } from '@/types/progress.types'

export default function ProgressPage() {
  const [weights, setWeights] = useState<WeightCheckin[]>([])
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [adherence, setAdherence] = useState<AdherenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [newWeight, setNewWeight] = useState('')
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    Promise.all([
      progressService.getWeightHistory(),
      progressService.getStreak(),
      progressService.getAdherence(),
    ])
      .then(([wRes, sRes, aRes]) => {
        setWeights((wRes.data as { data: WeightCheckin[] }).data ?? [])
        setStreak((sRes.data as { data: StreakData }).data)
        setAdherence((aRes.data as { data: AdherenceData }).data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const logWeight = async () => {
    if (!newWeight) return
    setLogging(true)
    try {
      const res = await progressService.logWeight(parseFloat(newWeight))
      setWeights(w => [(res.data as { data: WeightCheckin }).data, ...w])
      setNewWeight('')
    } catch {
      // silent
    } finally {
      setLogging(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Loader size="lg" />
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <h1 style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 32,
        color: 'var(--txt)',
        marginBottom: 20,
      }}>
        MI PROGRESO
      </h1>

      {/* Racha */}
      <Card style={{ marginBottom: 16, textAlign: 'center', padding: '24px 16px' }}>
        <StreakCounter count={streak?.currentStreak ?? 0} size="lg" />
        {streak && (
          <p style={{ fontSize: 12, color: 'var(--txt-dim)', marginTop: 8 }}>
            Mejor racha: {streak.longestStreak} días
          </p>
        )}
      </Card>

      {/* Adherencia */}
      {adherence && (
        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>📊 Adherencia</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 36,
                color: 'var(--orange)',
              }}>
                {adherence.weeklyAdherence}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Esta semana</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 36,
                color: 'var(--txt)',
              }}>
                {adherence.monthlyAdherence}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Este mes</div>
            </div>
          </div>
        </Card>
      )}

      {/* Registrar peso */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>⚖️ Registrar peso</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            type="number"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            placeholder="Ej: 75.5"
            style={{ flex: 1 }}
          />
          <Button onClick={logWeight} loading={logging} disabled={!newWeight}>Registrar</Button>
        </div>
      </Card>

      {/* Historial */}
      <Card>
        <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>📈 Historial de peso</h2>
        {weights.length === 0 ? (
          <p style={{ color: 'var(--txt-sub)', fontSize: 13, textAlign: 'center', padding: 16 }}>
            Aún no tienes registros de peso
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weights.slice(0, 10).map(w => (
              <div key={w.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 16,
                  color: 'var(--orange)',
                  fontWeight: 600,
                }}>
                  {w.weightKg} kg
                </span>
                <span style={{ fontSize: 12, color: 'var(--txt-sub)' }}>
                  {formatDate(w.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
