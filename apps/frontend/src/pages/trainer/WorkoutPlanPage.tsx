import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { workoutService } from '@/services/workout.service'
import { aiService } from '@/services/ai.service'
import { clientsService } from '@/services/clients.service'
import { Card, Button, Badge, Loader, Input } from '@/components/ui'
import type { WorkoutPlan } from '@/types/workout.types'
import type { Client } from '@/types/client.types'
import { PATHS } from '@/router/paths'

interface ExerciseLibraryItem {
  id: string
  name: string
  muscleGroup: string
  difficulty: string
  description?: string
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
          <p style={{ fontSize: 12 }}>Genera una con IA para empezar</p>
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
                      <Button size="sm" variant="ghost" style={{ flexShrink: 0 }}>
                        + Agregar
                      </Button>
                    </div>
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
    </div>
  )
}
