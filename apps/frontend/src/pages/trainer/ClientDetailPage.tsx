import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate, useParams } from 'react-router-dom'
import { clientsService } from '@/services/clients.service'
import { nutritionService } from '@/services/nutrition.service'
import { workoutService } from '@/services/workout.service'
import { chatService } from '@/services/chat.service'
import { aiService } from '@/services/ai.service'
import { useSocket } from '@/hooks/useSocket'
import { useChatStore } from '@/stores/chat.store'
import { Card, Avatar, Button, Badge, ProgressBar, Loader, Input } from '@/components/ui'
import { MessageBubble } from '@/components/shared/MessageBubble'
import { PATHS } from '@/router/paths'
import type { Client, ClientGoal, ActivityLevel, Gender } from '@/types/client.types'
import type { NutritionPlan } from '@/types/nutrition.types'
import type { WorkoutPlan } from '@/types/workout.types'
import type { Message } from '@/types/chat.types'

type Tab = 'profile' | 'nutrition' | 'workout' | 'progress' | 'feedback' | 'chat'

interface ProfileFormData {
  currentWeight: string
  targetWeight: string
  height: string
  dateOfBirth: string
  gender: Gender | ''
  activityLevel: ActivityLevel | ''
  goal: ClientGoal | ''
  restrictions: string[]
  injuries: string[]
}

interface FeedbackItem {
  id: string
  type: string
  comment: string
  resolved: boolean
  createdAt: string
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return format(date, 'd MMM', { locale: es })
}

function DateSeparator({ date }: { date: Date }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--txt-sub)', fontFamily: '"DM Sans"' }}>
        {getDateLabel(date)}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento',
  ATHLETIC_PERFORMANCE: 'Rendimiento atlético',
  GENERAL_HEALTH: 'Salud general',
}

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: 'Sedentario',
  LIGHTLY_ACTIVE: 'Ligeramente activo',
  MODERATELY_ACTIVE: 'Moderadamente activo',
  MODERATE: 'Moderado',
  VERY_ACTIVE: 'Muy activo',
  EXTREMELY_ACTIVE: 'Extremadamente activo',
}

const TAB_LIST: { key: Tab; label: string }[] = [
  { key: 'profile', label: '👤 Perfil' },
  { key: 'nutrition', label: '🥗 Nutrición' },
  { key: 'workout', label: '🏋️ Rutina' },
  { key: 'progress', label: '📈 Progreso' },
  { key: 'feedback', label: '💬 Feedback' },
  { key: 'chat', label: '💬 Chat' },
]

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('profile')
  const [client, setClient] = useState<Client | null>(null)
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { sendMessage } = useSocket()
  const storeMessages = useChatStore(s => s.messages)
  const setActiveClientId = useChatStore(s => s.setActiveClientId)
  const lastReadUpdate = useChatStore(s => s.lastReadUpdate)

  // Profile form state
  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState('')
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    currentWeight: '',
    targetWeight: '',
    height: '',
    dateOfBirth: '',
    gender: '',
    activityLevel: '',
    goal: '',
    restrictions: [],
    injuries: [],
  })
  const [restrictionInput, setRestrictionInput] = useState('')
  const [injuryInput, setInjuryInput] = useState('')

  useEffect(() => {
    if (!id) return
    clientsService.getOne(id)
      .then(res => {
        const data = (res.data as any).data as Client
        setClient(data)
        if (data?.profile) {
          setProfileForm({
            currentWeight: data.profile.currentWeight?.toString() ?? '',
            targetWeight: data.profile.targetWeight?.toString() ?? '',
            height: data.profile.height?.toString() ?? '',
            dateOfBirth: '',
            gender: data.profile.gender ?? '',
            activityLevel: data.profile.activityLevel ?? '',
            goal: data.profile.goal ?? '',
            restrictions: [],
            injuries: [],
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
    return () => {
      setActiveClientId(null)
    }
  }, [id, setActiveClientId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sincroniza mensajes nuevos del socket store al estado local cuando el chat está abierto
  useEffect(() => {
    if (tab !== 'chat' || storeMessages.length === 0) return
    const lastStore = storeMessages[storeMessages.length - 1]
    const msg = lastStore as any
    // Verificar que el mensaje pertenece a este cliente
    const isRelevant = msg.clientId === id || msg.senderId === id || msg.receiverId === id
    if (!isRelevant) return
    setMessages(prev => {
      // Ya existe con ese id (confirmación del servidor del optimista ya reemplazado)
      if (prev.some(m => m.id === lastStore.id)) return prev
      // Reemplazar optimista con la confirmación del servidor
      const optimisticIdx = prev.findIndex(
        m => m.id.startsWith('optimistic-') && m.content === lastStore.content && m.senderRole === lastStore.senderRole
      )
      if (optimisticIdx !== -1) {
        const next = [...prev]
        next[optimisticIdx] = lastStore
        return next
      }
      return [...prev, lastStore]
    })
  }, [storeMessages, tab, id])

  // Sincroniza el estado de lectura desde el socket al estado local de mensajes
  useEffect(() => {
    if (!lastReadUpdate || tab !== 'chat') return
    setMessages(prev => prev.map(msg => {
      const wasReadByOther =
        (lastReadUpdate.readBy === 'TRAINER' && msg.senderRole === 'CLIENT') ||
        (lastReadUpdate.readBy === 'CLIENT' && msg.senderRole === 'TRAINER')
      if (wasReadByOther && !msg.readAt) {
        return { ...msg, readAt: lastReadUpdate.timestamp, isRead: true }
      }
      return msg
    }))
  }, [lastReadUpdate, tab])

  const handleSaveProfile = async () => {
    if (!id) return
    setProfileSaving(true)
    setProfileSaveError('')
    try {
      const payload: Record<string, unknown> = {}
      if (profileForm.currentWeight) payload.currentWeight = parseFloat(profileForm.currentWeight)
      if (profileForm.targetWeight) payload.targetWeight = parseFloat(profileForm.targetWeight)
      if (profileForm.height) payload.height = parseFloat(profileForm.height)
      if (profileForm.dateOfBirth) payload.dateOfBirth = profileForm.dateOfBirth
      if (profileForm.gender) payload.gender = profileForm.gender
      if (profileForm.activityLevel) payload.activityLevel = profileForm.activityLevel
      if (profileForm.goal) payload.goal = profileForm.goal
      if (profileForm.restrictions.length > 0) payload.restrictions = profileForm.restrictions
      if (profileForm.injuries.length > 0) payload.injuries = profileForm.injuries

      const res = await clientsService.updateProfile(id, payload)
      const updatedProfile = (res.data as any).data
      setClient(prev => prev ? { ...prev, profile: updatedProfile ?? prev.profile } : prev)
      setProfileFormOpen(false)
    } catch {
      setProfileSaveError('Error al guardar los datos. Intenta de nuevo.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAddRestriction = () => {
    const val = restrictionInput.trim()
    if (val && !profileForm.restrictions.includes(val)) {
      setProfileForm(prev => ({ ...prev, restrictions: [...prev.restrictions, val] }))
    }
    setRestrictionInput('')
  }

  const handleRemoveRestriction = (tag: string) => {
    setProfileForm(prev => ({ ...prev, restrictions: prev.restrictions.filter(r => r !== tag) }))
  }

  const handleAddInjury = () => {
    const val = injuryInput.trim()
    if (val && !profileForm.injuries.includes(val)) {
      setProfileForm(prev => ({ ...prev, injuries: [...prev.injuries, val] }))
    }
    setInjuryInput('')
  }

  const handleRemoveInjury = (tag: string) => {
    setProfileForm(prev => ({ ...prev, injuries: prev.injuries.filter(i => i !== tag) }))
  }

  const loadTab = async (t: Tab) => {
    setTab(t)
    if (!id) return

    if (t === 'nutrition' && !nutritionPlan) {
      try {
        const res = await nutritionService.getActivePlan(id)
        const plan = (res.data as any).data
        if (plan) setNutritionPlan({ ...plan, isApproved: !!plan.approvedAt })
      } catch {}
    }
    if (t === 'workout' && !workoutPlan) {
      try {
        const res = await workoutService.getActivePlan(id)
        const plan = (res.data as any).data
        if (plan) setWorkoutPlan({ ...plan, isApproved: !!plan.approvedAt })
      } catch {}
    }
    if (t === 'chat') {
      setActiveClientId(id)
      try {
        const res = await chatService.getMessages(id, { limit: 100 })
        const raw: Message[] = (res.data as any).data ?? []
        // Ordena de más antiguo a más nuevo (ASC por createdAt)
        const sorted = [...raw].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        setMessages(sorted)
        await chatService.markAsRead(id)
      } catch {}
    }
    if (t === 'feedback' && feedback.length === 0) {
      try {
        const res = await clientsService.getFeedback(id)
        setFeedback((res.data as any).data ?? [])
      } catch {}
    }
  }

  const handleGenerateNutrition = async () => {
    if (!id) return
    setAiLoading(true)
    try {
      const res = await aiService.generateNutritionPlan(id)
      const plan = (res.data as any).data
      if (plan) setNutritionPlan({ ...plan, isApproved: !!plan.approvedAt })
    } catch (err) {
      console.error('Error generando plan nutricional:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateWorkout = async () => {
    if (!id) return
    setAiLoading(true)
    try {
      const res = await aiService.generateWorkoutPlan(id)
      const plan = (res.data as any).data
      if (plan) setWorkoutPlan({ ...plan, isApproved: !!plan.approvedAt })
    } catch (err) {
      console.error('Error generando rutina:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleApproveNutrition = async () => {
    if (!id || !nutritionPlan) return
    try {
      await nutritionService.approvePlan(id, nutritionPlan.id)
      setNutritionPlan(p => p ? { ...p, isApproved: true } : p)
    } catch {}
  }

  const handleApproveWorkout = async () => {
    if (!id || !workoutPlan) return
    try {
      await workoutService.approvePlan(id, workoutPlan.id)
      setWorkoutPlan(p => p ? { ...p, isApproved: true } : p)
    } catch {}
  }

  const handleSendChat = () => {
    if (!chatInput.trim() || !id) return
    const content = chatInput.trim()
    // Update optimista: el trainer ve su propio mensaje de inmediato
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversationId: '',
      senderId: '',
      senderRole: 'TRAINER',
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    sendMessage(content, id)
    setChatInput('')
  }

  const handleResolveFeedback = (feedbackId: string) => {
    setFeedback(prev => prev.map(f => f.id === feedbackId ? { ...f, resolved: true } : f))
  }

  if (loading || !client) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader size="lg" />
      </div>
    )
  }

  const pendingFeedback = feedback.filter(f => !f.resolved).length

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header cliente */}
      <div style={{
        padding: '20px 20px 16px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button
          onClick={() => navigate(PATHS.TRAINER.CLIENTS)}
          style={{ background: 'none', border: 'none', color: 'var(--txt-sub)', cursor: 'pointer', fontSize: 20, padding: 0, flexShrink: 0 }}
        >
          ←
        </button>
        <Avatar name={`${client.firstName} ${client.lastName}`} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontWeight: 700, fontSize: 18, color: 'var(--txt)', margin: 0 }}>
            {client.firstName} {client.lastName}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: '2px 0 0' }}>{client.email}</p>
          {client.profile?.goal && (
            <span style={{ marginTop: 4, display: 'inline-block' }}><Badge variant="orange">{client.profile.goal}</Badge></span>
          )}
        </div>
        <Badge variant={client.isActive ? 'success' : 'neutral'} dot>
          {client.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* Tabs scrollables */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        scrollbarWidth: 'none',
      }}>
        {TAB_LIST.map(t => (
          <button
            key={t.key}
            onClick={() => loadTab(t.key)}
            style={{
              flexShrink: 0,
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--orange)' : 'var(--txt-sub)',
              borderBottom: `2px solid ${tab === t.key ? 'var(--orange)' : 'transparent'}`,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              fontFamily: '"DM Sans", sans-serif',
              position: 'relative',
            }}
          >
            {t.key === 'feedback' && pendingFeedback > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--orange)',
              }} />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ padding: '16px 20px' }}>

        {/* PERFIL */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Datos personales (solo lectura) */}
            <Card>
              <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--txt)' }}>Datos personales</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Email</span>
                  <p style={{ color: 'var(--txt)', marginTop: 2, wordBreak: 'break-all' }}>{client.email}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Teléfono</span>
                  <p style={{ color: 'var(--txt)', marginTop: 2 }}>{client.phone ?? '—'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Estado</span>
                  <p style={{ marginTop: 4 }}>
                    <Badge variant={client.isActive ? 'success' : 'neutral'} dot>
                      {client.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Registro</span>
                  <p style={{ color: 'var(--txt)', marginTop: 2, fontFamily: '"DM Mono", monospace', fontSize: 12 }}>
                    {client.createdAt?.slice(0, 10) ?? '—'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Métricas físicas (solo lectura) */}
            {client.profile && (
              <Card>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--txt)' }}>Métricas físicas</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Peso actual', (client.profile.currentWeight ?? 0) > 0 ? `${client.profile.currentWeight} kg` : '—'],
                    ['Peso meta', (client.profile.targetWeight ?? 0) > 0 ? `${client.profile.targetWeight} kg` : '—'],
                    ['Talla', (client.profile.height ?? 0) > 0 ? `${client.profile.height} cm` : '—'],
                    ['Edad', (client.profile.age ?? 0) > 0 ? `${client.profile.age} años` : '—'],
                    ['Objetivo', client.profile.goal ? (GOAL_LABELS[client.profile.goal] ?? client.profile.goal) : '—'],
                    ['Actividad', client.profile.activityLevel ? (ACTIVITY_LABELS[client.profile.activityLevel] ?? client.profile.activityLevel) : '—'],
                    ['TDEE', (client.profile.tdee ?? 0) > 0 ? `${Math.round(client.profile.tdee!)} kcal` : '—'],
                    ['Calorías objetivo', (client.profile.targetCalories ?? 0) > 0 ? `${Math.round(client.profile.targetCalories!)} kcal` : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>{label}</span>
                      <p style={{ color: 'var(--txt)', marginTop: 2, fontFamily: '"DM Mono", monospace', fontSize: 13 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {(client.profile.proteinGrams || client.profile.carbsGrams || client.profile.fatGrams) && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: 12, color: 'var(--txt-sub)', marginBottom: 8 }}>Macros objetivo</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: 'var(--orange)' }}>
                          {client.profile.proteinGrams ?? 0}g
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--txt-sub)' }}>Proteína</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: 'var(--txt)' }}>
                          {client.profile.carbsGrams ?? 0}g
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--txt-sub)' }}>Carbos</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: '#EAB308' }}>
                          {client.profile.fatGrams ?? 0}g
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--txt-sub)' }}>Grasas</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Perfil motivacional del onboarding */}
            {client.onboardingCompleted && (
              <Card>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--txt)' }}>
                  Perfil motivacional (Onboarding IA)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  {(client.onboardingGoal || client.profile?.goal) && (
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Objetivo principal</span>
                      <p style={{ color: 'var(--txt)', marginTop: 2 }}>
                        {GOAL_LABELS[client.onboardingGoal ?? client.profile?.goal ?? ''] ?? client.onboardingGoal ?? client.profile?.goal}
                      </p>
                    </div>
                  )}
                  {(client.onboardingActivityLevel || client.profile?.activityLevel) && (
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Nivel de actividad</span>
                      <p style={{ color: 'var(--txt)', marginTop: 2 }}>
                        {ACTIVITY_LABELS[client.onboardingActivityLevel ?? client.profile?.activityLevel ?? ''] ?? client.onboardingActivityLevel ?? client.profile?.activityLevel}
                      </p>
                    </div>
                  )}
                  {client.onboardingMotivation && (
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Resumen IA</span>
                      <p style={{ color: 'var(--txt)', marginTop: 2, lineHeight: 1.5, fontSize: 13 }}>{client.onboardingMotivation}</p>
                    </div>
                  )}
                  {client.onboardingDietaryRestrictions && client.onboardingDietaryRestrictions.length > 0 && (
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Restricciones dietéticas</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {client.onboardingDietaryRestrictions.map(r => (
                          <Badge key={r} variant="neutral">{r}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {client.onboardingInjuries && client.onboardingInjuries.length > 0 && (
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Lesiones reportadas</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {client.onboardingInjuries.map(inj => (
                          <Badge key={inj} variant="warning">{inj}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {!client.onboardingGoal && !client.profile?.goal && !client.onboardingMotivation && !client.onboardingActivityLevel && (
                    <p style={{ color: 'var(--txt-sub)', fontSize: 12, fontStyle: 'italic' }}>
                      No hay datos del onboarding disponibles aún
                    </p>
                  )}
                </div>
              </Card>
            )}

            {!client.profile && client.onboardingCompleted && (
              <Card style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ fontSize: 24, marginBottom: 8 }}>✅</p>
                <p style={{ color: 'var(--txt)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Onboarding completado
                </p>
                <p style={{ color: 'var(--txt-sub)', fontSize: 13 }}>
                  El cliente completó el onboarding con IA. El perfil físico aún está pendiente de datos completos.
                </p>
              </Card>
            )}
            {!client.profile && !client.onboardingCompleted && (
              <Card style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ color: 'var(--txt-sub)', fontSize: 14 }}>El cliente aún no ha completado su perfil</p>
              </Card>
            )}

            {/* Botón para abrir/cerrar formulario editable */}
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setProfileFormOpen(v => !v)}
            >
              {profileFormOpen ? '▲ Cerrar editor' : '✏️ Editar datos del cliente'}
            </Button>

            {/* Formulario editable */}
            {profileFormOpen && (
              <Card>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--txt)' }}>Editar perfil físico</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Pesos y talla */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <Input
                      label="Peso actual (kg)"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="70"
                      value={profileForm.currentWeight}
                      onChange={e => setProfileForm(prev => ({ ...prev, currentWeight: e.target.value }))}
                    />
                    <Input
                      label="Peso meta (kg)"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="65"
                      value={profileForm.targetWeight}
                      onChange={e => setProfileForm(prev => ({ ...prev, targetWeight: e.target.value }))}
                    />
                    <Input
                      label="Altura (cm)"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="170"
                      value={profileForm.height}
                      onChange={e => setProfileForm(prev => ({ ...prev, height: e.target.value }))}
                    />
                  </div>

                  {/* Fecha de nacimiento */}
                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={e => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />

                  {/* Género */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, color: 'var(--txt-sub)', fontWeight: 500 }}>Género</label>
                    <select
                      value={profileForm.gender}
                      onChange={e => setProfileForm(prev => ({ ...prev, gender: e.target.value as Gender | '' }))}
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
                      <option value="">Seleccionar...</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Femenino</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>

                  {/* Nivel de actividad */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, color: 'var(--txt-sub)', fontWeight: 500 }}>Nivel de actividad</label>
                    <select
                      value={profileForm.activityLevel}
                      onChange={e => setProfileForm(prev => ({ ...prev, activityLevel: e.target.value as ActivityLevel | '' }))}
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
                      <option value="">Seleccionar...</option>
                      <option value="SEDENTARY">Sedentario</option>
                      <option value="LIGHTLY_ACTIVE">Ligeramente activo</option>
                      <option value="MODERATELY_ACTIVE">Moderadamente activo</option>
                      <option value="VERY_ACTIVE">Muy activo</option>
                      <option value="EXTREMELY_ACTIVE">Extremadamente activo</option>
                    </select>
                  </div>

                  {/* Objetivo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, color: 'var(--txt-sub)', fontWeight: 500 }}>Objetivo</label>
                    <select
                      value={profileForm.goal}
                      onChange={e => setProfileForm(prev => ({ ...prev, goal: e.target.value as ClientGoal | '' }))}
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
                      <option value="">Seleccionar...</option>
                      <option value="WEIGHT_LOSS">Pérdida de peso</option>
                      <option value="MUSCLE_GAIN">Ganancia muscular</option>
                      <option value="MAINTENANCE">Mantenimiento</option>
                      <option value="ATHLETIC_PERFORMANCE">Rendimiento atlético</option>
                      <option value="GENERAL_HEALTH">Salud general</option>
                    </select>
                  </div>

                  {/* Alergias alimentarias */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, color: 'var(--txt-sub)', fontWeight: 500 }}>Alergias / restricciones alimentarias</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Ej: gluten, lácteos..."
                        value={restrictionInput}
                        onChange={e => setRestrictionInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRestriction() } }}
                        style={{
                          flex: 1,
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--txt)',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 14,
                          padding: '8px 12px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddRestriction}
                        style={{
                          background: 'var(--border)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--txt)',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          fontSize: 13,
                          fontFamily: '"DM Sans", sans-serif',
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                    {profileForm.restrictions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {profileForm.restrictions.map(tag => (
                          <span key={tag} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'var(--orange)',
                            color: '#fff',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 12,
                            padding: '3px 10px',
                          }}>
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveRestriction(tag)}
                              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lesiones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, color: 'var(--txt-sub)', fontWeight: 500 }}>Lesiones</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Ej: rodilla, hombro..."
                        value={injuryInput}
                        onChange={e => setInjuryInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddInjury() } }}
                        style={{
                          flex: 1,
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--txt)',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 14,
                          padding: '8px 12px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddInjury}
                        style={{
                          background: 'var(--border)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--txt)',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          fontSize: 13,
                          fontFamily: '"DM Sans", sans-serif',
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                    {profileForm.injuries.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {profileForm.injuries.map(tag => (
                          <span key={tag} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'var(--border)',
                            color: 'var(--txt)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 12,
                            padding: '3px 10px',
                          }}>
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveInjury(tag)}
                              style={{ background: 'none', border: 'none', color: 'var(--txt-sub)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {profileSaveError && (
                    <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{profileSaveError}</p>
                  )}

                  <Button
                    fullWidth
                    onClick={handleSaveProfile}
                    loading={profileSaving}
                    disabled={profileSaving}
                  >
                    Guardar perfil
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* NUTRICIÓN */}
        {tab === 'nutrition' && (
          <div>
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Loader size="lg" />
                <p style={{ color: 'var(--txt-sub)', marginTop: 16, fontSize: 14 }}>
                  Generando plan nutricional con IA...
                </p>
                <p style={{ color: 'var(--txt-sub)', fontSize: 12, marginTop: 4 }}>
                  Esto puede tomar unos segundos
                </p>
              </div>
            ) : (
              <>
                <Button fullWidth onClick={handleGenerateNutrition} style={{ marginBottom: 16 }}>
                  ✨ Generar con IA
                </Button>
                {nutritionPlan ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontWeight: 600, color: 'var(--txt)', fontSize: 16 }}>{nutritionPlan.name}</h3>
                        <p style={{ fontSize: 12, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace', marginTop: 2 }}>
                          {nutritionPlan.targetCalories} kcal · {nutritionPlan.targetProtein}P · {nutritionPlan.targetCarbs}C · {nutritionPlan.targetFat}G
                        </p>
                      </div>
                      {nutritionPlan.isApproved ? (
                        <Badge variant="success">Aprobado</Badge>
                      ) : (
                        <Button size="sm" onClick={handleApproveNutrition}>
                          ✓ Aprobar
                        </Button>
                      )}
                    </div>
                    {(nutritionPlan.meals ?? []).map(meal => (
                      <Card key={meal.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <h4 style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)' }}>{meal.name}</h4>
                          {meal.scheduledTime && (
                            <span style={{ fontSize: 11, color: 'var(--txt-sub)', fontFamily: '"DM Mono", monospace' }}>
                              {meal.scheduledTime}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--txt-sub)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}>
                          <span>P:{meal.items.reduce((s, i) => s + i.protein, 0).toFixed(0)}g C:{meal.items.reduce((s, i) => s + i.carbs, 0).toFixed(0)}g G:{meal.items.reduce((s, i) => s + i.fat, 0).toFixed(0)}g</span>
                          <span style={{ fontFamily: '"DM Mono", monospace', color: 'var(--txt)' }}>{meal.items.reduce((s, i) => s + i.calories, 0).toFixed(0)} kcal</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>🥗</p>
                    <p style={{ fontSize: 14 }}>No hay plan nutricional activo</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Genera uno con IA o crea uno manualmente</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* RUTINA */}
        {tab === 'workout' && (
          <div>
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Loader size="lg" />
                <p style={{ color: 'var(--txt-sub)', marginTop: 16, fontSize: 14 }}>
                  Generando rutina con IA...
                </p>
                <p style={{ color: 'var(--txt-sub)', fontSize: 12, marginTop: 4 }}>
                  Esto puede tomar unos segundos
                </p>
              </div>
            ) : (
              <>
                <Button fullWidth onClick={handleGenerateWorkout} style={{ marginBottom: 16 }}>
                  ✨ Generar con IA
                </Button>
                {workoutPlan ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontWeight: 600, color: 'var(--txt)', fontSize: 16 }}>{workoutPlan.name}</h3>
                      {workoutPlan.isApproved ? (
                        <Badge variant="success">Aprobado</Badge>
                      ) : (
                        <Button size="sm" onClick={handleApproveWorkout}>
                          ✓ Aprobar
                        </Button>
                      )}
                    </div>
                    {(workoutPlan.days ?? []).map(day => (
                      <Card key={day.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: day.isRestDay ? 0 : 8 }}>
                          <h4 style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)' }}>{day.name ?? day.dayOfWeek}</h4>
                          {day.isRestDay && <Badge variant="neutral">Descanso</Badge>}
                        </div>
                        {!day.isRestDay && (day.exercises ?? []).map(ex => (
                          <div key={ex.id} style={{
                            fontSize: 12,
                            color: 'var(--txt-sub)',
                            padding: '5px 0',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <span style={{ color: 'var(--txt)' }}>{ex.name}</span>
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11 }}>
                              {ex.sets}×{ex.reps} · {ex.restSeconds}s
                            </span>
                          </div>
                        ))}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>🏋️</p>
                    <p style={{ fontSize: 14 }}>No hay rutina activa</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Genera una con IA o crea una manualmente</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PROGRESO */}
        {tab === 'progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {client.profile && (
              <Card>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--txt)' }}>Progreso de peso</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Peso actual</p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, color: 'var(--txt)', fontWeight: 600 }}>
                      {client.profile.currentWeight ?? '—'} kg
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--txt-sub)' }}>Meta</p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, color: 'var(--orange)', fontWeight: 600 }}>
                      {client.profile.targetWeight ?? '—'} kg
                    </p>
                  </div>
                </div>
                {client.profile.currentWeight && client.profile.targetWeight && (
                  <>
                    <ProgressBar
                      value={client.profile.currentWeight}
                      max={client.profile.targetWeight}
                      height={6}
                      color="var(--orange)"
                    />
                    <p style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4, textAlign: 'center' }}>
                      {Math.abs(client.profile.currentWeight - client.profile.targetWeight).toFixed(1)} kg para la meta
                    </p>
                  </>
                )}
              </Card>
            )}

            {client.profile && (
              <Card>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--txt)' }}>Composición</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
                  <div>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: 'var(--txt)' }}>
                      {client.profile.height ?? '—'}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--txt-sub)' }}>cm talla</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: 'var(--txt)' }}>
                      {client.profile.age ?? '—'}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--txt-sub)' }}>años</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, color: 'var(--orange)' }}>
                      {client.profile.tdee ?? '—'}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--txt-sub)' }}>kcal TDEE</p>
                  </div>
                </div>
              </Card>
            )}

            {!client.profile && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
                <p>
                  {client.onboardingCompleted
                    ? 'Onboarding completado — datos físicos detallados aún pendientes'
                    : 'El cliente aún no tiene datos de progreso'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {tab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feedback.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
                <p style={{ fontSize: 14 }}>Sin feedback pendiente</p>
              </div>
            ) : (
              feedback.map(f => (
                <Card key={f.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Badge variant={f.resolved ? 'success' : 'warning'}>{f.type}</Badge>
                        {f.resolved && <Badge variant="success">Resuelto</Badge>}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--txt)', lineHeight: 1.5 }}>{f.comment}</p>
                      <p style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 4, fontFamily: '"DM Mono", monospace' }}>
                        {f.createdAt?.slice(0, 10)}
                      </p>
                    </div>
                    {!f.resolved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolveFeedback(f.id)}
                        style={{ flexShrink: 0 }}
                      >
                        ✓ Resolver
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* CHAT */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 8,
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-sub)' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
                  <p style={{ fontSize: 14 }}>Inicia la conversación con tu cliente</p>
                </div>
              )}
              {(() => {
                const items: React.ReactNode[] = []
                let lastDate: Date | null = null
                messages.forEach(msg => {
                  const msgDate = new Date(msg.createdAt)
                  if (!lastDate || !isSameDay(lastDate, msgDate)) {
                    items.push(<DateSeparator key={`sep-${msg.id}`} date={msgDate} />)
                    lastDate = msgDate
                  }
                  items.push(
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isMine={msg.senderRole === 'TRAINER'}
                    />
                  )
                })
                return items
              })()}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }}
                placeholder="Escribe un mensaje..."
                style={{
                  flex: 1,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '10px 16px',
                  color: 'var(--txt)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  background: chatInput.trim() ? 'var(--orange)' : 'var(--border)',
                  color: chatInput.trim() ? '#fff' : 'var(--txt-sub)',
                  cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 16,
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
