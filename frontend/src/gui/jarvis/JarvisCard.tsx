import { useEffect, useRef, useState } from 'react'
import { DraggableGlass } from '../canvas/DraggableGlass'
import { askMarvin, type ChatMessage } from '../../core/ollama'
import type { ModulePosition } from '../../core/types'

const GREETING =
  'Herzlich willkommen. Ich bin Marvin, deine persönliche Assistenz. Sollen wir gemeinsam beginnen, deinen Arbeitsplatz aufzubauen? Ich begleite dich dabei, aus deinem Wissen und deinem Fachgebiet eine persönliche, spezialisierte Intelligenz zu entwickeln.'

interface DisplayMessage {
  id: number
  text: string
}

function pickBestGermanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const german = voices.filter((v) => v.lang.toLowerCase().startsWith('de'))
  const preferred = german.find((v) => /anna|premium|enhanced/i.test(v.name))
  return preferred ?? german[0]
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.98
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    const voice = pickBestGermanVoice(voices)
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      const loaded = window.speechSynthesis.getVoices()
      const voice = pickBestGermanVoice(loaded)
      if (voice) utterance.voice = voice
      window.speechSynthesis.speak(utterance)
    }
  }
}

function getSpeechRecognition(): any {
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-4 h-4 ${active ? 'text-red-300' : 'text-white/70'}`} fill="currentColor">
      <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
      <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.92V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.08A7 7 0 0019 11z" />
    </svg>
  )
}

export function JarvisCard({
  entered,
  startPosition,
  onDragEnd,
}: {
  entered: boolean
  startPosition: ModulePosition
  onDragEnd: (bounds: DOMRect | undefined) => void
}) {
  const [visibleChars, setVisibleChars] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const hasGreeted = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const greetingDone = visibleChars >= GREETING.length
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognition()))
  }, [])

  useEffect(() => {
    if (!entered || hasGreeted.current) return
    hasGreeted.current = true

    setVisibleChars(0)
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setVisibleChars(i)
      if (i >= GREETING.length) clearInterval(interval)
    }, 28)
    speak(GREETING)
    setHistory([{ role: 'assistant', content: GREETING }])
    return () => {
      clearInterval(interval)
      window.speechSynthesis.cancel()
    }
  }, [entered])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  const toggleListening = () => {
    const SpeechRecognitionCtor = getSpeechRecognition()
    if (!SpeechRecognitionCtor) return
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'de-DE'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || isThinking) return
    setMessages((prev) => [...prev, { id: Date.now(), text }])
    const newHistory: ChatMessage[] = [...history, { role: 'user', content: text }]
    setHistory(newHistory)
    setInputValue('')
    setIsThinking(true)
    try {
      const reply = await askMarvin(newHistory)
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply }])
      setHistory((prev) => [...prev, { role: 'assistant', content: reply }])
      speak(reply)
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, text: '(Verbindung zu Marvins Verstand fehlgeschlagen — läuft Ollama?)' },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <DraggableGlass
      initialPosition={startPosition}
      initialSize={{ width: 576, height: 460 }}
      title="Marvin"
      className="rounded-[2rem]"
      collapsible
      defaultOpen
      onDragEnd={onDragEnd}
      containerRef={containerRef}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-2 space-y-4">
        <p className="font-display text-2xl leading-relaxed text-white">
          {GREETING.slice(0, visibleChars)}
          {!greetingDone && (
            <span className="inline-block w-[2px] h-6 bg-white ml-1 align-middle animate-pulse" />
          )}
        </p>
        {messages.map((m) => (
          <p key={m.id} className="font-display text-2xl leading-relaxed text-white opacity-90">
            {m.text}
          </p>
        ))}
        {isThinking && <p className="font-display text-2xl leading-relaxed text-white opacity-50">…</p>}
      </div>

      {greetingDone && (
        <form onSubmit={handleSubmit} className="px-10 pb-9 pt-2 flex gap-2 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Schreib Marvin..."
            className="flex-1 bg-white/10 border border-white/40 rounded-xl px-4 py-2 text-white placeholder-white/50 font-body text-sm focus:outline-none focus:border-white/80 select-text cursor-text"
            autoFocus
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isListening ? 'bg-red-400/20 border-red-300/60' : 'bg-white/10 border-white/40 hover:border-white/70'
              }`}
              aria-label={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
            >
              <MicIcon active={isListening} />
            </button>
          )}
        </form>
      )}
    </DraggableGlass>
  )
}