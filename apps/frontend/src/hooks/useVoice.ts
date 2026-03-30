export const useVoice = () => {
  const startListening = (onCommand: (command: string) => void): (() => void) | undefined => {
    const SpeechRecognition = (window as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
      ?? (window as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition
    if (!SpeechRecognition) return undefined

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'es-CO'
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1
      const command = event.results[last][0].transcript.toLowerCase().trim()
      if (command.includes('listo') || command.includes('done')) {
        onCommand('COMPLETE_SET')
      }
    }

    recognition.start()
    return () => recognition.stop()
  }

  const speak = (text: string, lang: 'es' | 'en' = 'es') => {
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'es' ? 'es-CO' : 'en-US'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }

  const announceRest = (seconds: number, lang: 'es' | 'en') => {
    speak(lang === 'es' ? `Descanso de ${seconds} segundos` : `${seconds} second rest`, lang)
  }

  const announceSessionEnd = (duration: number, streak: number, lang: 'es' | 'en') => {
    const msg = lang === 'es'
      ? `Sesión completada. ${duration} minutos. Racha día ${streak}. Excelente trabajo.`
      : `Session complete. ${duration} minutes. Streak day ${streak}. Excellent work.`
    speak(msg, lang)
  }

  return { startListening, speak, announceRest, announceSessionEnd }
}

interface SpeechRecognitionInstance {
  continuous: boolean
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}
