import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { nutritionService } from '@/services/nutrition.service'
import { aiService } from '@/services/ai.service'
import { clientsService } from '@/services/clients.service'
import { Card, Button, Input, Badge, Loader, Modal } from '@/components/ui'
import type { NutritionPlan, MealItem, MealType } from '@/types/nutrition.types'
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

interface AddFoodState {
  food: FoodResult
  mealId: string
  quantity: string
}

interface NewMealState {
  name: string
  mealType: MealType
  scheduledTime: string
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
  const [addFoodState, setAddFoodState] = useState<AddFoodState | null>(null)
  const [addFoodSaving, setAddFoodSaving] = useState(false)
  const [addFoodError, setAddFoodError] = useState('')
  const [newMealOpen, setNewMealOpen] = useState(false)
  const [newMealState, setNewMealState] = useState<NewMealState>({ name: '', mealType: 'BREAKFAST', scheduledTime: '' })
  const [newMealSaving, setNewMealSaving] = useState(false)
  const [newMealError, setNewMealError] = useState('')
  const [createPlanOpen, setCreatePlanOpen] = useState(false)
  const [createPlanName, setCreatePlanName] = useState('')
  const [createPlanCalories, setCreatePlanCalories] = useState('')
  const [createPlanSaving, setCreatePlanSaving] = useState(false)
  const [createPlanError, setCreatePlanError] = useState('')

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

  const handleOpenAddFood = (food: FoodResult) => {
    if (!plan || plan.meals.length === 0) return
    setAddFoodState({ food, mealId: plan.meals[0].id, quantity: '100' })
    setAddFoodError('')
  }

  const handleConfirmAddFood = async () => {
    if (!id || !plan || !addFoodState) return
    const qty = parseFloat(addFoodState.quantity)
    if (!qty || qty <= 0) {
      setAddFoodError('Ingresa una cantidad válida')
      return
    }
    setAddFoodSaving(true)
    setAddFoodError('')
    try {
      const res = await nutritionService.addMealItem(id, plan.id, addFoodState.mealId, {
        foodId: addFoodState.food.id,
        quantity: qty,
      })
      const newItem = (res.data as any).data as MealItem
      if (newItem) {
        setPlan(prev => prev ? {
          ...prev,
          meals: prev.meals.map(m =>
            m.id === addFoodState.mealId
              ? { ...m, items: [...m.items, newItem] }
              : m
          ),
        } : prev)
      }
      setAddFoodState(null)
    } catch {
      setAddFoodError('Error al agregar el alimento. Intenta de nuevo.')
    } finally {
      setAddFoodSaving(false)
    }
  }

  const handleCreatePlanManual = async () => {
    if (!id || !createPlanName.trim()) {
      setCreatePlanError('El nombre del plan es requerido')
      return
    }
    setCreatePlanSaving(true)
    setCreatePlanError('')
    try {
      const payload: Record<string, unknown> = { name: createPlanName.trim() }
      if (createPlanCalories) payload.targetCalories = parseInt(createPlanCalories)
      const res = await nutritionService.createPlan(id, payload)
      const newPlan = (res.data as any).data
      if (newPlan) {
        setPlan({ ...newPlan, meals: newPlan.meals ?? [] })
      }
      setCreatePlanOpen(false)
      setCreatePlanName('')
      setCreatePlanCalories('')
    } catch {
      setCreatePlanError('Error al crear el plan. Intenta de nuevo.')
    } finally {
      setCreatePlanSaving(false)
    }
  }

  const handleCreateMeal = async () => {
    if (!id || !plan || !newMealState.name.trim()) {
      setNewMealError('El nombre de la comida es requerido')
      return
    }
    setNewMealSaving(true)
    setNewMealError('')
    try {
      const res = await nutritionService.addMeal(id, plan.id, {
        name: newMealState.name.trim(),
        mealType: newMealState.mealType,
        scheduledTime: newMealState.scheduledTime || undefined,
      })
      const newMeal = (res.data as any).data
      if (newMeal) {
        setPlan(prev => prev ? { ...prev, meals: [...prev.meals, { ...newMeal, items: [] }] } : prev)
      }
      setNewMealOpen(false)
      setNewMealState({ name: '', mealType: 'BREAKFAST', scheduledTime: '' })
    } catch {
      setNewMealError('Error al crear la comida. Intenta de nuevo.')
    } finally {
      setNewMealSaving(false)
    }
  }

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
        {!plan && (
          <Button variant="secondary" onClick={() => { setCreatePlanOpen(true); setCreatePlanError('') }} style={{ flexShrink: 0 }}>
            + Manual
          </Button>
        )}
        {plan && !plan.isApproved && (
          <Button variant="secondary" onClick={handleApprovePlan}>
            ✓ Aprobar
          </Button>
        )}
        {plan && (
          <Button variant="ghost" onClick={() => { setNewMealOpen(true); setNewMealError('') }} style={{ flexShrink: 0 }}>
            + Comida
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
          <p style={{ fontSize: 12, marginBottom: 16 }}>Genera uno con IA o créalo manualmente</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setCreatePlanOpen(true); setCreatePlanError('') }}
          >
            + Crear plan manual
          </Button>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    style={{ flexShrink: 0 }}
                    onClick={() => handleOpenAddFood(food)}
                    disabled={!plan || plan.meals.length === 0}
                  >
                    + Agregar
                  </Button>
                </div>
                {/* Mini-formulario inline para este alimento */}
                {addFoodState?.food.id === food.id && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--txt-sub)', fontWeight: 500 }}>Agregar a la comida</label>
                      <select
                        value={addFoodState.mealId}
                        onChange={e => setAddFoodState(prev => prev ? { ...prev, mealId: e.target.value } : prev)}
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--txt)',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          padding: '8px 10px',
                          outline: 'none',
                          width: '100%',
                        }}
                      >
                        {plan!.meals.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          label="Cantidad (g)"
                          type="number"
                          min="1"
                          step="1"
                          value={addFoodState.quantity}
                          onChange={e => setAddFoodState(prev => prev ? { ...prev, quantity: e.target.value } : prev)}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleConfirmAddFood}
                        loading={addFoodSaving}
                        disabled={addFoodSaving}
                        style={{ flexShrink: 0, marginBottom: addFoodError ? 0 : 0 }}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddFoodState(null)}
                        disabled={addFoodSaving}
                        style={{ flexShrink: 0 }}
                      >
                        Cancelar
                      </Button>
                    </div>
                    {addFoodError && (
                      <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{addFoodError}</p>
                    )}
                  </div>
                )}
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

      {/* Modal crear plan manual */}
      <Modal
        isOpen={createPlanOpen}
        onClose={() => setCreatePlanOpen(false)}
        title="Crear plan nutricional"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Nombre del plan"
            placeholder="Ej: Plan de volumen semana 1"
            value={createPlanName}
            onChange={e => setCreatePlanName(e.target.value)}
            autoFocus
          />
          <Input
            label="Calorías objetivo (opcional)"
            type="number"
            min="0"
            placeholder="Ej: 2500"
            value={createPlanCalories}
            onChange={e => setCreatePlanCalories(e.target.value)}
          />
          {createPlanError && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{createPlanError}</p>
          )}
          <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: 0 }}>
            Luego podrás agregar tiempos de comida (desayuno, almuerzo, cena...) y sus alimentos.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button fullWidth onClick={handleCreatePlanManual} loading={createPlanSaving} disabled={createPlanSaving}>
              Crear plan
            </Button>
            <Button variant="ghost" onClick={() => setCreatePlanOpen(false)} disabled={createPlanSaving}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal nueva comida */}
      <Modal isOpen={newMealOpen} onClose={() => setNewMealOpen(false)} title="Nueva comida" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Nombre de la comida"
            placeholder="Ej: Desayuno, Merienda..."
            value={newMealState.name}
            onChange={e => setNewMealState(prev => ({ ...prev, name: e.target.value }))}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--txt-sub)', fontWeight: 500 }}>Tipo de comida</label>
            <select
              value={newMealState.mealType}
              onChange={e => setNewMealState(prev => ({ ...prev, mealType: e.target.value as MealType }))}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--txt)',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                padding: '10px 12px',
                outline: 'none',
                width: '100%',
              }}
            >
              <option value="BREAKFAST">Desayuno</option>
              <option value="MORNING_SNACK">Merienda mañana</option>
              <option value="LUNCH">Almuerzo</option>
              <option value="AFTERNOON_SNACK">Merienda tarde</option>
              <option value="DINNER">Cena</option>
              <option value="POST_WORKOUT">Post entreno</option>
            </select>
          </div>
          <Input
            label="Hora programada (opcional)"
            type="time"
            value={newMealState.scheduledTime}
            onChange={e => setNewMealState(prev => ({ ...prev, scheduledTime: e.target.value }))}
          />
          {newMealError && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{newMealError}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button fullWidth onClick={handleCreateMeal} loading={newMealSaving} disabled={newMealSaving}>
              Crear comida
            </Button>
            <Button variant="ghost" onClick={() => setNewMealOpen(false)} disabled={newMealSaving}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
