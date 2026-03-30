import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { nutritionService } from '@/services/nutrition.service'
import { aiService } from '@/services/ai.service'
import { clientsService } from '@/services/clients.service'
import { Card, Button, Input, Badge, Loader } from '@/components/ui'
import type { NutritionPlan, MealItem } from '@/types/nutrition.types'
import type { Client } from '@/types/client.types'
import { PATHS } from '@/router/paths'

interface FoodResult {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: number
  servingUnit: string
}

export default function NutritionPlanPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      clientsService.getOne(id),
      nutritionService.getActivePlan(id).catch(() => ({ data: { data: null } })),
    ])
      .then(([clientRes, planRes]) => {
        setClient((clientRes.data as any).data)
        setPlan((planRes.data as any).data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleGenerateAI = async () => {
    if (!id) return
    setAiLoading(true)
    try {
      const res = await aiService.generateNutritionPlan(id)
      setPlan((res.data as any).data)
    } catch {} finally {
      setAiLoading(false)
    }
  }

  const handleApprovePlan = async () => {
    if (!id || !plan) return
    try {
      await nutritionService.approvePlan(id, plan.id)
      setPlan(p => p ? { ...p, isApproved: true } : p)
    } catch {}
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const res = await nutritionService.searchFoods(searchQuery)
      setSearchResults((res.data as any).data ?? [])
    } catch {
      setSearchError('Error al buscar alimentos')
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => id && navigate(PATHS.TRAINER.CLIENT_DETAIL(id))}
          style={{ background: 'none', border: 'none', color: 'var(--txt-sub)', cursor: 'pointer', fontSize: 20, padding: 0 }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: 'var(--txt)', letterSpacing: 1, margin: 0 }}>
            PLAN NUTRICIONAL
          </h1>
          {client && (
            <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: 0 }}>
              {client.firstName} {client.lastName}
            </p>
          )}
        </div>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <Loader size="lg" />
          <p style={{ color: '#fff', marginTop: 20, fontSize: 16, fontWeight: 600 }}>
            Generando plan nutricional con IA...
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>
            Analizando perfil y objetivos del cliente
          </p>
        </div>
      )}

      {/* Acciones principales */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Button fullWidth onClick={handleGenerateAI} disabled={aiLoading}>
          ✨ Generar con IA
        </Button>
        {plan && !plan.isApproved && (
          <Button variant="secondary" onClick={handleApprovePlan}>
            ✓ Aprobar
          </Button>
        )}
      </div>

      {/* Plan activo */}
      {plan ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--txt)', margin: 0 }}>{plan.name}</h2>
              <p style={{ fontSize: 12, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace', marginTop: 2 }}>
                {plan.targetCalories} kcal · P:{plan.targetProtein}g · C:{plan.targetCarbs}g · G:{plan.targetFat}g
              </p>
            </div>
            {plan.isApproved && <Badge variant="success">Aprobado</Badge>}
          </div>

          {plan.meals.map(meal => (
            <Card key={meal.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', margin: 0 }}>{meal.name}</h4>
                {meal.scheduledTime && (
                  <span style={{ fontSize: 11, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace' }}>
                    {meal.scheduledTime}
                  </span>
                )}
              </div>
              {meal.items.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--txt-sub)', fontStyle: 'italic' }}>Sin alimentos</p>
              ) : (
                meal.items.map((item: MealItem) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderTop: '1px solid var(--border)',
                    fontSize: 12,
                  }}>
                    <div>
                      <span style={{ color: 'var(--txt)', fontWeight: 500 }}>{item.foodName}</span>
                      <span style={{ color: 'var(--txt-sub)', marginLeft: 6 }}>— {item.quantity}{item.unit}</span>
                    </div>
                    <span style={{ fontFamily: '"DM Mono", monospace', color: 'var(--orange)', fontSize: 11 }}>
                      {item.calories} kcal
                    </span>
                  </div>
                ))
              )}
            </Card>
          ))}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🥗</p>
          <p style={{ fontSize: 14, marginBottom: 4 }}>No hay plan nutricional activo</p>
          <p style={{ fontSize: 12 }}>Genera uno con IA para empezar</p>
        </div>
      )}

      {/* Buscador de alimentos */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: 'var(--txt)', marginBottom: 12, letterSpacing: 1 }}>
          BUSCAR ALIMENTOS
        </h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            placeholder="Ej: pollo, arroz, manzana..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <Button
            variant="secondary"
            onClick={handleSearch}
            loading={searching}
            style={{ flexShrink: 0 }}
          >
            Buscar
          </Button>
        </div>

        {searchError && (
          <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{searchError}</p>
        )}

        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.map(food => (
              <Card key={food.id} padding="sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)', margin: 0 }}>{food.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace', marginTop: 2 }}>
                      {food.servingSize}{food.servingUnit} · {food.calories} kcal · P:{food.protein}g · C:{food.carbs}g · G:{food.fat}g
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" style={{ flexShrink: 0 }}>
                    + Agregar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!searching && searchQuery && searchResults.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--txt-sub)', textAlign: 'center' }}>
            Sin resultados para "{searchQuery}"
          </p>
        )}
      </div>
    </div>
  )
}
