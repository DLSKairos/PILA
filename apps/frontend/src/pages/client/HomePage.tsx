import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/stores/client.store'
import { useTrackingStore } from '@/stores/tracking.store'
import { trackingService } from '@/services/tracking.service'
import { progressService } from '@/services/progress.service'
import { Card, ProgressBar, Loader } from '@/components/ui'
import { StreakCounter } from '@/components/shared/StreakCounter'
import { InAppMessageToast } from '@/components/shared/InAppMessageToast'
import { PATHS } from '@/router/paths'
import type { DailyLog } from '@/types/tracking.types'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const profile = useClientStore(s => s.profile)
  const nutritionPlan = useClientStore(s => s.nutritionPlan)
  const { waterCount, addWater, mealCompletions, completeMeal, setToday } = useTrackingStore()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([trackingService.getToday(), progressService.getStreak()])
      .then(([todayRes]) => {
        const log = (todayRes.data as { data: DailyLog }).data
        setDailyLog(log)
        setToday({ ...log, mealCompletions: log.mealCompletions ?? [] })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [setToday])

  const handleCompleteMeal = async (mealItemId: string, done: boolean) => {
    try {
      if (!done) {
        await trackingService.completeMeal(mealItemId)
        completeMeal(mealItemId)
      } else {
        await trackingService.uncompleteMeal(mealItemId)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddWater = async () => {
    try {
      await trackingService.addWater()
      addWater()
    } catch (e) {
      console.error(e)
    }
  }

  const firstName = profile?.firstName ?? 'Campeón'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  const allItems = nutritionPlan?.meals?.flatMap(m => m.items) ?? []
  const completedCount = allItems.filter(i => mealCompletions[i.id]).length

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Loader size="lg" />
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <InAppMessageToast />

      {/* Saludo */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 28,
          color: 'var(--txt)',
          letterSpacing: 1,
        }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontSize: 12, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace' }}>
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Racha */}
      <Card style={{ marginBottom: 16, textAlign: 'center', padding: '24px 16px' }}>
        <StreakCounter count={dailyLog?.streakCount ?? 0} size="lg" />
      </Card>

      {/* Alimentación del día */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontWeight: 600, fontSize: 15, color: 'var(--txt)' }}>🥗 Alimentación de hoy</h2>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: 'var(--txt-sub)' }}>
            {completedCount}/{allItems.length}
          </span>
        </div>
        <ProgressBar value={completedCount} max={Math.max(allItems.length, 1)} showLabel height={6} />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(nutritionPlan?.meals ?? []).slice(0, 5).map(meal => {
            const mealDone = meal.items.every(i => mealCompletions[i.id])
            return (
              <div
                key={meal.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => meal.items[0] && handleCompleteMeal(meal.items[0].id, mealDone)}
              >
                <span style={{
                  fontSize: 14,
                  color: mealDone ? 'var(--txt-dim)' : 'var(--txt)',
                  textDecoration: mealDone ? 'line-through' : 'none',
                }}>
                  {meal.name}
                </span>
                <span style={{ fontSize: 18 }}>{mealDone ? '✅' : '⭕'}</span>
              </div>
            )
          })}
          {(nutritionPlan?.meals ?? []).length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--txt-sub)', textAlign: 'center' }}>
              Tu entrenador pronto activará tu plan
            </p>
          )}
        </div>
      </Card>

      {/* Agua */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontWeight: 600, fontSize: 15, color: 'var(--txt)' }}>💧 Agua</h2>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: 'var(--txt-sub)' }}>
            {waterCount}/{dailyLog?.waterGoal ?? 8} vasos
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: dailyLog?.waterGoal ?? 8 }).map((_, i) => (
            <button
              key={i}
              onClick={() => { if (i >= waterCount) handleAddWater() }}
              style={{
                fontSize: 24,
                background: 'none',
                border: 'none',
                cursor: i >= waterCount ? 'pointer' : 'default',
                opacity: i < waterCount ? 1 : 0.3,
                transform: i < waterCount ? 'scale(1)' : 'scale(0.85)',
                transition: 'all 0.2s',
              }}
            >
              💧
            </button>
          ))}
        </div>
      </Card>

      {/* Gym */}
      {dailyLog && !dailyLog.gymSession && (
        <Card>
          <h2 style={{ fontWeight: 600, fontSize: 15, color: 'var(--txt)', marginBottom: 12 }}>🏋️ Rutina de hoy</h2>
          <button
            onClick={() => navigate(PATHS.CLIENT.GYM)}
            style={{
              width: '100%',
              padding: '16px',
              background: 'var(--orange)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 24,
              letterSpacing: 2,
              cursor: 'pointer',
              boxShadow: '0 4px 20px var(--orange-glow, rgba(255,92,0,0.3))',
            }}
          >
            LLEGUÉ AL GYM 💪
          </button>
        </Card>
      )}
    </div>
  )
}
