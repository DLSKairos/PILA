import { useEffect, useState } from 'react'
import { useTrackingStore } from '@/stores/tracking.store'
import { nutritionService } from '@/services/nutrition.service'
import { trackingService } from '@/services/tracking.service'
import { aiService } from '@/services/ai.service'
import { Card, ProgressBar, BottomSheet, Button, Loader } from '@/components/ui'
import { MacroBadge } from '@/components/shared/MacroBadge'
import type { NutritionPlan, MealItem } from '@/types/nutrition.types'

const MEAL_NAMES: Record<string, string> = {
  BREAKFAST: '🌅 Desayuno',
  MORNING_SNACK: '🍎 Media mañana',
  LUNCH: '🍽️ Almuerzo',
  AFTERNOON_SNACK: '☕ Merienda',
  DINNER: '🌙 Cena',
  POST_WORKOUT: '💪 Post entreno',
}

export default function NutritionPage() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [subItem, setSubItem] = useState<MealItem | null>(null)
  const [subResult, setSubResult] = useState<MealItem | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const { mealCompletions, completeMeal, uncompleteMeal, substitutionAttempts, requestSubstitution } = useTrackingStore()

  useEffect(() => {
    nutritionService.getMyPlan()
      .then(res => setPlan((res.data as { data: NutritionPlan }).data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggleMeal = async (itemId: string, done: boolean) => {
    try {
      if (!done) {
        await trackingService.completeMeal(itemId)
        completeMeal(itemId)
      } else {
        await trackingService.uncompleteMeal(itemId)
        uncompleteMeal(itemId)
      }
    } catch {
      // silent
    }
  }

  const requestSub = async (item: MealItem) => {
    if (substitutionAttempts >= 3) return
    setSubItem(item)
    setSubResult(null)
    setSubLoading(true)
    requestSubstitution(item.id)
    try {
      const res = await aiService.sendOnboardingMessage(`Sustituir: ${item.foodName}`)
      setSubResult((res.data as { data: MealItem }).data)
    } catch {
      setSubResult(null)
    } finally {
      setSubLoading(false)
    }
  }

  const totalMacros = (plan?.meals?.flatMap(m => m.items) ?? []).reduce(
    (acc, i) => ({ p: acc.p + i.protein, c: acc.c + i.carbs, f: acc.f + i.fat, kcal: acc.kcal + i.calories }),
    { p: 0, c: 0, f: 0, kcal: 0 }
  )

  const completedMacros = (plan?.meals?.flatMap(m => m.items) ?? [])
    .filter(i => mealCompletions[i.id])
    .reduce(
      (acc, i) => ({ p: acc.p + i.protein, c: acc.c + i.carbs, f: acc.f + i.fat, kcal: acc.kcal + i.calories }),
      { p: 0, c: 0, f: 0, kcal: 0 }
    )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Loader size="lg" />
    </div>
  )

  if (!plan) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--txt-sub)' }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🥗</p>
      <p>Tu entrenador pronto activará tu plan nutricional</p>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {/* Macros resumen */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 20,
          color: 'var(--txt)',
          marginBottom: 12,
          letterSpacing: 1,
        }}>
          MACROS DEL DÍA
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ProgressBar
            value={completedMacros.kcal}
            max={totalMacros.kcal || 1}
            label={`${completedMacros.kcal} / ${totalMacros.kcal} kcal`}
            showLabel
            color="var(--orange)"
          />
          <ProgressBar
            value={completedMacros.p}
            max={totalMacros.p || 1}
            label={`Proteína ${completedMacros.p}/${totalMacros.p}g`}
            showLabel
            color="var(--blue, #3B82F6)"
          />
          <ProgressBar
            value={completedMacros.c}
            max={totalMacros.c || 1}
            label={`Carbos ${completedMacros.c}/${totalMacros.c}g`}
            showLabel
            color="#EAB308"
          />
          <ProgressBar
            value={completedMacros.f}
            max={totalMacros.f || 1}
            label={`Grasa ${completedMacros.f}/${totalMacros.f}g`}
            showLabel
            color="var(--red)"
          />
        </div>
      </Card>

      {/* Comidas */}
      {plan.meals.map(meal => (
        <Card key={meal.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)' }}>
              {MEAL_NAMES[meal.mealType] ?? meal.name}
            </h3>
            {meal.scheduledTime && (
              <span style={{ fontSize: 11, color: 'var(--txt-dim)', fontFamily: '"DM Mono", monospace' }}>
                {meal.scheduledTime}
              </span>
            )}
          </div>
          {meal.items.map(item => {
            const done = mealCompletions[item.id] ?? false
            return (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <button
                  onClick={() => toggleMeal(item.id, done)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${done ? 'var(--orange)' : 'var(--border)'}`,
                    background: done ? 'var(--orange)' : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                  }}
                >
                  {done ? '✓' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    color: done ? 'var(--txt-dim)' : 'var(--txt)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {item.foodName}{' '}
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: 'var(--txt-dim)' }}>
                      {item.quantity}{item.unit}
                    </span>
                  </div>
                  <MacroBadge protein={item.protein} carbs={item.carbs} fat={item.fat} size="sm" />
                </div>
                <button
                  onClick={() => requestSub(item)}
                  style={{
                    fontSize: 11,
                    color: 'var(--txt-dim)',
                    background: 'none',
                    border: '1px solid var(--border)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  No tengo
                </button>
              </div>
            )
          })}
        </Card>
      ))}

      {/* BottomSheet sustitución */}
      <BottomSheet isOpen={!!subItem} onClose={() => setSubItem(null)} size="md" title="SUSTITUCIÓN SUGERIDA">
        {subLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader />
          </div>
        ) : subResult ? (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, color: 'var(--txt-dim)', marginBottom: 4 }}>Original</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{subItem?.foodName}</div>
                <MacroBadge protein={subItem?.protein ?? 0} carbs={subItem?.carbs ?? 0} fat={subItem?.fat ?? 0} size="sm" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--orange)', fontSize: 20 }}>→</div>
              <div style={{
                flex: 1,
                padding: 12,
                background: 'var(--orange-dim)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--orange)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--orange)', marginBottom: 4 }}>Sustituto</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{subResult.foodName}</div>
                <MacroBadge protein={subResult.protein} carbs={subResult.carbs} fat={subResult.fat} size="sm" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {substitutionAttempts < 3 && (
                <Button variant="ghost" size="sm" onClick={() => subItem && requestSub(subItem)}>
                  Otra opción ({substitutionAttempts}/3)
                </Button>
              )}
              <Button fullWidth onClick={() => setSubItem(null)}>✓ Aceptar sustitución</Button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--txt-sub)', textAlign: 'center' }}>No se pudo generar sustitución</p>
        )}
      </BottomSheet>
    </div>
  )
}
