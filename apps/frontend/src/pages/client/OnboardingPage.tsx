import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { aiService } from '@/services/ai.service'
import { notificationsService } from '@/services/notifications.service'
import { ProgressBar, Button, Loader } from '@/components/ui'
import { PATHS } from '@/router/paths'

interface ChatMessage {
  role: 'ai' | 'user'
  text: string
}

const MAX_TURNS = 6

export default function OnboardingPage() {
  const { userId } = useAuthStore()
  const storageKey = `pila-onboarding-${userId}`
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [turn, setTurn] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}-turn`)
    return saved ? parseInt(saved) : 0
  })
  const [aiThinking, setAiThinking] = useState(false)
  const [completed, setCompleted] = useState(false)
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0) startOnboarding()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages))
    localStorage.setItem(`${storageKey}-turn`, String(turn))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, turn, storageKey])

  const startOnboarding = async () => {
    setAiThinking(true)
    try {
      const res = await aiService.getOnboardingStatus()
      const firstMsg = (res.data as { data?: { nextQuestion?: string } }).data?.nextQuestion
        ?? '¡Hola! Soy PILA 💪 Cuéntame, ¿cuál es tu principal objetivo: perder grasa, ganar músculo o mejorar tu rendimiento?'
      setMessages([{ role: 'ai', text: firstMsg }])
      setTurn(1)
    } catch {
      setMessages([{ role: 'ai', text: '¡Hola! Soy PILA 💪 ¿Cuál es tu principal objetivo fitness?' }])
      setTurn(1)
    } finally {
      setAiThinking(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || aiThinking) return
    const userMsg = input.trim()
    setInput('')
    const newMsgs: ChatMessage[] = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMsgs)
    const newTurn = turn + 1
    setTurn(newTurn)

    if (newTurn >= MAX_TURNS) {
      setCompleted(true)
      return
    }

    setAiThinking(true)
    try {
      const res = await aiService.sendOnboardingMessage(userMsg)
      const reply = (res.data as { data?: { reply?: string; completed?: boolean } }).data?.reply ?? ''
      if (reply) setMessages(m => [...m, { role: 'ai', text: reply }])
      if ((res.data as { data?: { completed?: boolean } }).data?.completed) setCompleted(true)
    } catch (err: any) {
      const isCredits = err?.response?.data?.message?.toString().toLowerCase().includes('credit') ||
        err?.response?.status === 400
      const errMsg = isCredits
        ? 'El asistente IA no está disponible en este momento. Tu entrenador lo activará pronto. Puedes continuar igual 💪'
        : 'Hubo un problema al procesar tu respuesta. Intenta de nuevo.'
      setMessages(m => [...m, { role: 'ai', text: errMsg }])
    } finally {
      setAiThinking(false)
    }
  }

  const requestNotifications = async () => {
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
        if (vapid) await notificationsService.subscribe(vapid)
      }
    } catch {
      // silent
    } finally {
      navigate(PATHS.CLIENT.HOME, { replace: true })
    }
  }

  if (completed) return (
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
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h1 style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 36,
        color: 'var(--orange)',
        letterSpacing: 2,
        marginBottom: 8,
      }}>
        ¡YA ESTAMOS LISTOS!
      </h1>
      <p style={{ color: 'var(--txt-sub)', fontSize: 14, marginBottom: 40 }}>
        Tu entrenador ya preparó todo para ti
      </p>
      <Button fullWidth size="lg" onClick={requestNotifications} style={{ maxWidth: 280, marginBottom: 12 }}>
        🔔 Activar notificaciones
      </Button>
      <button
        onClick={() => navigate(PATHS.CLIENT.HOME, { replace: true })}
        style={{ color: 'var(--txt-dim)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Ahora no
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header progreso */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, color: 'var(--orange)', marginBottom: 8 }}>
          PILA
        </div>
        <ProgressBar value={turn} max={MAX_TURNS} color="var(--orange)" />
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              background: msg.role === 'user' ? 'var(--orange)' : 'var(--card)',
              color: msg.role === 'user' ? '#fff' : 'var(--txt)',
              border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              fontSize: 14,
              lineHeight: 1.5,
              animation: 'fadeUp 0.3s ease',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {aiThinking && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
            <Loader size="sm" />
            <span style={{ fontSize: 13, color: 'var(--txt-sub)' }}>PILA está pensando...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 8,
        background: 'var(--card)',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
          placeholder="Escribe tu respuesta..."
          disabled={aiThinking}
          style={{
            flex: 1,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '10px 16px',
            color: 'var(--txt)',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || aiThinking}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: input.trim() && !aiThinking ? 'var(--orange)' : 'var(--border)',
            color: '#fff',
            cursor: input.trim() && !aiThinking ? 'pointer' : 'not-allowed',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
