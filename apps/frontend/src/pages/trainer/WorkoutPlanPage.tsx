import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { workoutService } from '@/services/workout.service'
import { aiService } from '@/services/ai.service'
import { clientsService } from '@/services/clients.service'
import { Card, Button, Badge, Loader, Input, Modal } from '@/components/ui'
import type { WorkoutPlan, DayOfWeek, WorkoutDay, WorkoutExercise } from '@/types/workout.types'
import type { Client } from '@/types/client.types'
import { PATHS } from '@/router/paths'

interface ExerciseLibraryItem {
  id: string
  name: string
  muscleGroup: string
  difficulty: string
  description?: string
}

interface NewDayState {
  name: string
  dayOfWeek: DayOfWeek
  isRestDay: boolean
  targetMuscles: string
}

interface AddExerciseState {
  exercise: ExerciseLibraryItem
  dayId: string
  sets: string
  reps: string
  restSeconds: string
  weightKg: string
  order: string
}

export default function WorkoutPlanPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [libraryItems, setLibraryItems] = useState<ExerciseLibraryItem[]>([])
  const [libraryFilter, setLibraryFilter] = useState('')
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [newDayOpen, setNewDayOpen] = useState(false)
  const [newDayState, setNewDayState] = useState<NewDayState>({
    name: '',
    dayOfWeek: 'MONDAY',
    isRestDay: false,
    targetMuscles: '',
  })
  const [newDaySaving, setNewDaySaving] = useState(false)
  const [newDayError, setNewDayError] = useState('')
  const [addExerciseState, setAddExerciseState] = useState<AddExerciseState | null>(null)
  const [addExerciseSaving, setAddExerciseSaving] = useState(false)
  const [addExerciseError, setAddExerciseError] = useState('')
  const [createPlanOpen, setCreatePlanOpen] = useState(false)
  const [createPlanName, setCreatePlanName] = useState('')
  const [createPlanSaving, setCreatePlanSaving] = useState(false)
  const [createPlanError, setCreatePlanError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      clientsService.getOne(id),
      workoutService.getActivePlan(id).catch(() => ({ data: { data: null } })),
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
      const res = await aiService.generateWorkoutPlan(id)
      setPlan((res.data as any).data)
    } catch {} finally {
      setAiLoading(false)
    }
  }

  const handleApprovePlan = async () => {
    if (!id || !plan) return
    try {
      await workoutService.approvePlan(id, plan.id)
      setPlan(p => p ? { ...p, isApproved: true } : p)
    } catch {}
  }

  const handleLoadLibrary = async () => {
    setShowLibrary(true)
    setLibraryLoading(true)
    try {
      const res = await workoutService.getLibrary()
      setLibraryItems((res.data as any).data ?? [])
    } catch {} finally {
      setLibraryLoading(false)
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
      const res = await workoutService.createPlan(id, { name: createPlanName.trim() })
      const newPlan = (res.data as any).data
      if (newPlan) {
        setPlan({ ...newPlan, days: newPlan.days ?? [] })
      }
      setCreatePlanOpen(false)
      setCreatePlanName('')
    } catch {
      setCreatePlanError('Error al crear el plan. Intenta de nuevo.')
    } finally {
      setCreatePlanSaving(false)
    }
  }

  const handleCreateDay = async () => {
    if (!id || !plan || !newDayState.name.trim()) {
      setNewDayError('El nombre del día es requerido')
      return
    }
    setNewDaySaving(true)
    setNewDayError('')
    try {
      const payload: Record<string, unknown> = {
        name: newDayState.name.trim(),
        dayOfWeek: newDayState.dayOfWeek,
        isRestDay: newDayState.isRestDay,
      }
      if (newDayState.targetMuscles.trim()) {
        payload.targetMuscles = newDayState.targetMuscles.split(',').map(s => s.trim()).filter(Boolean)
      }
      const res = await workoutService.addDay(id, plan.id, payload)
      const newDay = (res.data as any).data as WorkoutDay
      if (newDay) {
        setPlan(prev => prev ? { ...prev, days: [...prev.days, { ...newDay, exercises: newDay.exercises ?? [] }] } : prev)
      }
      setNewDayOpen(false)
      setNewDayState({ name: '', dayOfWeek: 'MONDAY', isRestDay: false, targetMuscles: '' })
    } catch {
      setNewDayError('Error al crear el día. Intenta de nuevo.')
    } finally {
      setNewDaySaving(false)
    }
  }

  const handleOpenAddExercise = (exercise: ExerciseLibraryItem) => {
    if (!plan || plan.days.length === 0) return
    const firstActiveDay = plan.days.find(d => !d.isRestDay) ?? plan.days[0]
    setAddExerciseState({
      exercise,
      dayId: firstActiveDay.id,
      sets: '3',
      reps: '10',
      restSeconds: '60',
      weightKg: '',
      order: '1',
    })
    setAddExerciseError('')
  }

  const handleConfirmAddExercise = async () => {
    if (!id || !plan || !addExerciseState) return
    const sets = parseInt(addExerciseState.sets)
    const restSeconds = parseInt(addExerciseState.restSeconds)
    if (!sets || sets <= 0 || !addExerciseState.reps.trim()) {
      setAddExerciseError('Series y repeticiones son requeridas')
      return
    }
    setAddExerciseSaving(true)
    setAddExerciseError('')
    try {
      const payload: Record<string, unknown> = {
        exerciseId: addExerciseState.exercise.id,
        sets,
        reps: addExerciseState.reps.trim(),
        restSeconds: restSeconds || 60,
        order: parseInt(addExerciseState.order) || 1,
      }
      if (addExerciseState.weightKg) payload.weightKg = parseFloat(addExerciseState.weightKg)
      const res = await workoutService.addExercise(id, plan.id, addExerciseState.dayId, payload)
      const newExercise = (res.data as any).data as WorkoutExercise
      if (newExercise) {
        setPlan(prev => prev ? {
          ...prev,
          days: prev.days.map(d =>
            d.id === addExerciseState.dayId
              ? { ...d, exercises: [...d.exercises, newExercise] }
              : d
          ),
        } : prev)
      }
      setAddExerciseState(null)
    } catch {
      setAddExerciseError('Error al agregar el ejercicio. Intenta de nuevo.')
    } finally {
      setAddExerciseSaving(false)
    }
  }

  const filteredLibrary = libraryFilter
    ? libraryItems.filter(ex =>
        ex.name.toLowerCase().includes(libraryFilter.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(libraryFilter.toLowerCase())
      )
    : libraryItems

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
            PLAN DE ENTRENAMIENTO
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
            Generando rutina con IA...
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>
            Diseñando plan personalizado para el cliente
          </p>
        </div>
      )}

      {/* Acciones */}
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
          <Button variant="ghost" onClick={() => { setNewDayOpen(true); setNewDayError('') }} style={{ flexShrink: 0 }}>
            + Día
          </Button>
        )}
      </div>

      {/* Plan activo */}
      {plan ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--txt)', margin: 0 }}>{plan.name}</h2>
            {plan.isApproved && <Badge variant="success">Aprobado</Badge>}
          </div>

          {plan.days.map(day => (
            <Card key={day.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: day.isRestDay ? 0 : 10 }}>
                <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)', margin: 0 }}>
                  {day.name}
                  <span style={{ fontSize: 11, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace', marginLeft: 8 }}>
                    {day.dayOfWeek}
                  </span>
                </h4>
                {day.isRestDay && <Badge variant="neutral">Descanso</Badge>}
              </div>
              {!day.isRestDay && day.exercises.map(ex => (
                <div key={ex.id} style={{
                  padding: '8px 0',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)', margin: 0 }}>{ex.name}</p>
                    {ex.muscleGroup && (
                      <p style={{ fontSize: 11, color: 'var(--txt-sub)', margin: '2px 0 0' }}>{ex.muscleGroup}</p>
                    )}
                    {ex.notes && (
                      <p style={{ fontSize: 11, color: 'var(--txt-sub)', margin: '2px 0 0', fontStyle: 'italic' }}>{ex.notes}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, color: 'var(--orange)', fontWeight: 600 }}>
                      {ex.sets}×{ex.reps}
                    </span>
                    <p style={{ fontSize: 10, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace', margin: '2px 0 0' }}>
                      {ex.restSeconds}s descanso
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏋️</p>
          <p style={{ fontSize: 14, marginBottom: 4 }}>No hay rutina activa</p>
          <p style={{ fontSize: 12, marginBottom: 16 }}>Genera una con IA o créala manualmente</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setCreatePlanOpen(true); setCreatePlanError('') }}
          >
            + Crear rutina manual
          </Button>
        </div>
      )}

      {/* Librería de ejercicios */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: 'var(--txt)', letterSpacing: 1, margin: 0 }}>
            LIBRERÍA DE EJERCICIOS
          </h2>
          {!showLibrary && (
            <Button size="sm" variant="secondary" onClick={handleLoadLibrary}>
              Ver librería
            </Button>
          )}
        </div>

        {showLibrary && (
          <>
            <Input
              placeholder="Filtrar por nombre o músculo..."
              value={libraryFilter}
              onChange={e => setLibraryFilter(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            {libraryLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Loader size="md" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredLibrary.map(ex => (
                  <Card key={ex.id} padding="sm">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)', margin: 0 }}>{ex.name}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <Badge variant="neutral">{ex.muscleGroup}</Badge>
                          <Badge variant={
                            ex.difficulty === 'BEGINNER' ? 'success'
                              : ex.difficulty === 'INTERMEDIATE' ? 'warning'
                                : 'error'
                          }>
                            {ex.difficulty === 'BEGINNER' ? 'Principiante'
                              : ex.difficulty === 'INTERMEDIATE' ? 'Intermedio'
                                : 'Avanzado'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ flexShrink: 0 }}
                        onClick={() => handleOpenAddExercise(ex)}
                        disabled={!plan || plan.days.length === 0}
                      >
                        + Agregar
                      </Button>
                    </div>
                    {/* Mini-formulario inline para este ejercicio */}
                    {addExerciseState?.exercise.id === ex.id && (
                      <div style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, color: 'var(--txt-sub)', fontWeight: 500 }}>Agregar al día</label>
                          <select
                            value={addExerciseState.dayId}
                            onChange={e => setAddExerciseState(prev => prev ? { ...prev, dayId: e.target.value } : prev)}
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
                            {plan!.days.map(d => (
                              <option key={d.id} value={d.id}>{d.name}{d.isRestDay ? ' (descanso)' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <Input
                            label="Series"
                            type="number"
                            min="1"
                            value={addExerciseState.sets}
                            onChange={e => setAddExerciseState(prev => prev ? { ...prev, sets: e.target.value } : prev)}
                          />
                          <Input
                            label="Reps"
                            type="text"
                            placeholder="10 o 8-12"
                            value={addExerciseState.reps}
                            onChange={e => setAddExerciseState(prev => prev ? { ...prev, reps: e.target.value } : prev)}
                          />
                          <Input
                            label="Descanso (s)"
                            type="number"
                            min="0"
                            value={addExerciseState.restSeconds}
                            onChange={e => setAddExerciseState(prev => prev ? { ...prev, restSeconds: e.target.value } : prev)}
                          />
                        </div>
                        <Input
                          label="Peso (kg, opcional)"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="Sin peso"
                          value={addExerciseState.weightKg}
                          onChange={e => setAddExerciseState(prev => prev ? { ...prev, weightKg: e.target.value } : prev)}
                        />
                        {addExerciseError && (
                          <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{addExerciseError}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            size="sm"
                            onClick={handleConfirmAddExercise}
                            loading={addExerciseSaving}
                            disabled={addExerciseSaving}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAddExerciseState(null)}
                            disabled={addExerciseSaving}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                {filteredLibrary.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--txt-sub)', textAlign: 'center' }}>
                    {libraryFilter ? 'Sin resultados' : 'Librería vacía'}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal crear plan manual */}
      <Modal
        isOpen={createPlanOpen}
        onClose={() => setCreatePlanOpen(false)}
        title="Crear rutina de entrenamiento"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Nombre del plan"
            placeholder="Ej: Rutina de fuerza 5 días"
            value={createPlanName}
            onChange={e => setCreatePlanName(e.target.value)}
            autoFocus
          />
          {createPlanError && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{createPlanError}</p>
          )}
          <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: 0 }}>
            Luego podrás agregar días de entrenamiento (lunes, martes...) y los ejercicios de cada día.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button fullWidth onClick={handleCreatePlanManual} loading={createPlanSaving} disabled={createPlanSaving}>
              Crear rutina
            </Button>
            <Button variant="ghost" onClick={() => setCreatePlanOpen(false)} disabled={createPlanSaving}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal nuevo día */}
      <Modal
        isOpen={newDayOpen}
        onClose={() => setNewDayOpen(false)}
        title="Agregar día de entrenamiento"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Nombre del día"
            placeholder="Ej: Día 1 - Pecho y tríceps"
            value={newDayState.name}
            onChange={e => setNewDayState(prev => ({ ...prev, name: e.target.value }))}
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--txt-sub)', fontWeight: 500 }}>Día de la semana</label>
            <select
              value={newDayState.dayOfWeek}
              onChange={e => setNewDayState(prev => ({ ...prev, dayOfWeek: e.target.value as DayOfWeek }))}
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
              <option value="MONDAY">Lunes</option>
              <option value="TUESDAY">Martes</option>
              <option value="WEDNESDAY">Miércoles</option>
              <option value="THURSDAY">Jueves</option>
              <option value="FRIDAY">Viernes</option>
              <option value="SATURDAY">Sábado</option>
              <option value="SUNDAY">Domingo</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--txt)' }}>
            <input
              type="checkbox"
              checked={newDayState.isRestDay}
              onChange={e => setNewDayState(prev => ({ ...prev, isRestDay: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: 'var(--orange)', cursor: 'pointer' }}
            />
            Día de descanso
          </label>
          {!newDayState.isRestDay && (
            <Input
              label="Músculos objetivo (separados por coma, opcional)"
              placeholder="Ej: Pecho, Tríceps, Hombros"
              value={newDayState.targetMuscles}
              onChange={e => setNewDayState(prev => ({ ...prev, targetMuscles: e.target.value }))}
            />
          )}
          {newDayError && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{newDayError}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button fullWidth onClick={handleCreateDay} loading={newDaySaving} disabled={newDaySaving}>
              Agregar día
            </Button>
            <Button variant="ghost" onClick={() => setNewDayOpen(false)} disabled={newDaySaving}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
