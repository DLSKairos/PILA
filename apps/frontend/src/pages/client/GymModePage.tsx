import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrackingStore } from '@/stores/tracking.store'
import { trackingService } from '@/services/tracking.service'
import { workoutService } from '@/services/workout.service'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useVoice } from '@/hooks/useVoice'
import { Button, BottomSheet, Input } from '@/components/ui'
import { formatDuration } from '@/utils/format.util'
import type { WorkoutExercise } from '@/types/workout.types'

type GymState = 'PRE' | 'ACTIVE' | 'POST'

interface ExerciseLogForm {
  weight: string
  sets: string
  reps: string
}

export default function GymModePage() {
  const [gymState, setGymState] = useState<GymState>('PRE')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [activeExercise, setActiveExercise] = useState<WorkoutExercise | null>(null)
  const [exerciseLog, setExerciseLog] = useState<ExerciseLogForm>({ weight: '', sets: '', reps: '' })
  const [duration, setDuration] = useState(0)
  const [records, setRecords] = useState<string[]>([])
  const [checkinLoading, setCheckinLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { startGymSession, endGymSession, voiceModeActive, toggleVoiceMode } = useTrackingStore()
  const { checkGymProximity } = useGeolocation()
  const { speak } = useVoice()
  const navigate = useNavigate()

  useEffect(() => {
    workoutService.getTodayWorkout()
      .then(res => setExercises((res.data as { data?: { exercises?: WorkoutExercise[] } }).data?.exercises ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (gymState === 'ACTIVE') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gymState])

  const handleCheckin = async () => {
    setCheckinLoading(true)
    try {
      const proximity = await checkGymProximity()
      const gym = proximity.gym as { id?: string } | undefined
      const gymId = gym?.id ?? 'manual'
      await trackingService.gymCheckin(gymId)
      startGymSession(gymId)
      setGymState('ACTIVE')
    } catch {
      // fallback sin error — igual iniciamos
      setGymState('ACTIVE')
    } finally {
      setCheckinLoading(false)
    }
  }

  const handleCompleteExercise = async () => {
    if (!activeExercise) return
    try {
      const data = {
        setsCompleted: parseInt(exerciseLog.sets) || activeExercise.sets,
        repsCompleted: exerciseLog.reps || activeExercise.reps,
        weightKg: exerciseLog.weight ? parseFloat(exerciseLog.weight) : undefined,
      }
      const res = await trackingService.completeExercise(activeExercise.id, data)
      const isRecord = (res.data as { data?: { isPersonalRecord?: boolean } }).data?.isPersonalRecord
      if (isRecord) {
        setRecords(r => [...r, activeExercise.name])
        if (voiceModeActive) speak('¡Nuevo récord personal!')
      }
      const newCompleted = new Set([...completedIds, activeExercise.id])
      setCompletedIds(newCompleted)
      setActiveExercise(null)
      setExerciseLog({ weight: '', sets: '', reps: '' })
      if (exercises.length > 0 && newCompleted.size >= exercises.length) {
        setGymState('POST')
      }
    } catch {
      setActiveExercise(null)
    }
  }

  const handleFinish = async () => {
    try {
      await trackingService.gymCheckout()
    } catch {
      // silent
    }
    endGymSession()
    navigate(-1)
  }

  // PRE
  if (gymState === 'PRE') return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 48,
        color: 'var(--orange)',
        letterSpacing: 2,
        marginBottom: 8,
      }}>
        GYM MODE
      </div>
      <p style={{ color: 'var(--txt-sub)', fontSize: 14, marginBottom: 48 }}>
        {exercises.length > 0 ? `${exercises.length} ejercicios hoy` : 'Listo para entrenar'}
      </p>
      <button
        onClick={handleCheckin}
        disabled={checkinLoading}
        style={{
          width: '85%',
          maxWidth: 320,
          padding: '22px 0',
          background: checkinLoading ? 'var(--border)' : 'var(--orange)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-xl, 20px)',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 28,
          letterSpacing: 2,
          cursor: checkinLoading ? 'not-allowed' : 'pointer',
          boxShadow: checkinLoading ? 'none' : '0 8px 32px var(--orange-glow, rgba(255,92,0,0.3))',
          transition: 'all 0.3s',
        }}
      >
        {checkinLoading ? '📍 Verificando ubicación...' : 'LLEGUÉ AL GYM 💪'}
      </button>
    </div>
  )

  // POST
  if (gymState === 'POST') return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
      <div style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 40,
        color: 'var(--orange)',
        letterSpacing: 2,
        marginBottom: 24,
      }}>
        ¡SESIÓN COMPLETADA!
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: 'var(--txt)' }}>
            {formatDuration(duration)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Duración</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: 'var(--txt)' }}>
            {completedIds.size}/{exercises.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Ejercicios</div>
        </div>
      </div>
      {records.length > 0 && (
        <div style={{
          background: 'var(--orange-dim)',
          border: '1px solid var(--orange)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          marginBottom: 24,
          width: '100%',
          maxWidth: 320,
        }}>
          <p style={{ color: 'var(--orange)', fontWeight: 600, marginBottom: 8 }}>🏆 Récords personales</p>
          {records.map((r, i) => (
            <p key={i} style={{ fontSize: 13, color: 'var(--txt)' }}>• {r}</p>
          ))}
        </div>
      )}
      <Button size="lg" fullWidth onClick={handleFinish} style={{ maxWidth: 280 }}>Finalizar</Button>
    </div>
  )

  // ACTIVE
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'fixed', inset: 0, overflowY: 'auto' }}>
      {/* Cronómetro */}
      <div style={{
        padding: '24px 16px 16px',
        textAlign: 'center',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 56,
          color: 'var(--orange)',
          letterSpacing: 4,
        }}>
          {formatDuration(duration)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--txt-sub)' }}>
          {completedIds.size}/{exercises.length} ejercicios
        </div>
        <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 'var(--radius-full)' }}>
          <div style={{
            height: '100%',
            width: `${exercises.length ? (completedIds.size / exercises.length) * 100 : 0}%`,
            background: 'var(--orange)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s',
          }} />
        </div>
      </div>

      {/* Lista ejercicios */}
      <div style={{ padding: '12px 16px' }}>
        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-sub)' }}>
            <p>No hay ejercicios programados para hoy</p>
            <Button style={{ marginTop: 16 }} onClick={() => setGymState('POST')}>
              Finalizar de todos modos
            </Button>
          </div>
        )}
        {exercises.map(ex => {
          const done = completedIds.has(ex.id)
          return (
            <div
              key={ex.id}
              onClick={() => !done && setActiveExercise(ex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 12px',
                marginBottom: 8,
                background: done ? 'var(--orange-dim)' : 'var(--card)',
                border: `1px solid ${done ? 'var(--orange)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                cursor: done ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{done ? '✅' : '⭕'}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: done ? 400 : 600,
                  color: done ? 'var(--txt-dim)' : 'var(--txt)',
                }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: 11, fontFamily: '"DM Mono", monospace', color: 'var(--txt-sub)' }}>
                  {ex.sets}×{ex.reps} · {ex.restSeconds}s descanso
                </div>
              </div>
              {done && records.includes(ex.name) && <span style={{ fontSize: 16 }}>🏆</span>}
            </div>
          )
        })}
      </div>

      {/* Botón voz flotante */}
      <button
        onClick={() => {
          toggleVoiceMode()
          if (!voiceModeActive) speak('Modo voz activado')
        }}
        style={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: voiceModeActive ? 'var(--orange)' : 'var(--card)',
          border: '2px solid var(--orange)',
          cursor: 'pointer',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: voiceModeActive ? '0 4px 16px var(--orange-glow, rgba(255,92,0,0.3))' : 'none',
        }}
      >
        🎤
      </button>

      {/* BottomSheet por ejercicio */}
      <BottomSheet
        isOpen={!!activeExercise}
        onClose={() => setActiveExercise(null)}
        size="lg"
        title={activeExercise?.name}
      >
        {activeExercise && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: 12,
              background: 'var(--bg)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              color: 'var(--txt-sub)',
            }}>
              Objetivo: {activeExercise.sets} series × {activeExercise.reps} repeticiones
            </div>
            <Input
              label="Peso usado (kg)"
              type="number"
              value={exerciseLog.weight}
              onChange={e => setExerciseLog(l => ({ ...l, weight: e.target.value }))}
              placeholder="0"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Series"
                type="number"
                value={exerciseLog.sets}
                onChange={e => setExerciseLog(l => ({ ...l, sets: e.target.value }))}
                placeholder={String(activeExercise.sets)}
              />
              <Input
                label="Reps"
                value={exerciseLog.reps}
                onChange={e => setExerciseLog(l => ({ ...l, reps: e.target.value }))}
                placeholder={activeExercise.reps}
              />
            </div>
            <Button fullWidth size="lg" onClick={handleCompleteExercise}>
              ✓ Marcar como completado
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
