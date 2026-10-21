// Web Speech API service for reading prompts and instructions aloud in Spanish
// Features human-paced sentence & punctuation chunking, warm prosody, and friendly voice selection

export interface SpeechChunk {
  text: string
  pauseAfterMs: number
}

class SpeechService {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private queueTimeoutId: number | null = null
  private generationId = 0
  private lastSpokenText = ''
  private lastSpokenTime = 0
  private listeners: (() => void)[] = []

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.initVoices()
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.initVoices()
        }
      }
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb())
  }

  private initVoices() {
    if (!this.synth) return
    const voices = this.synth.getVoices()
    if (!voices || voices.length === 0) return

    const storedVoiceName =
      typeof localStorage !== 'undefined' ? localStorage.getItem('app_memoria_voice') : null

    const spanishVoices = voices.filter((v) => v.lang.startsWith('es'))

    // 1. If user previously chose a specific voice, respect it
    if (storedVoiceName) {
      const saved = spanishVoices.find((v) => v.name === storedVoiceName)
      if (saved) {
        this.voice = saved
        this.notify()
        return
      }
    }

    // Prioritized female voice names from sweetest, warmest, and most conversational
    const prioritizedFemaleNames = [
      'laura', // Microsoft Laura (Windows OneCore - warm, pleasant, friendly, soft)
      'elvira', // Microsoft Elvira Online (Natural - gentle neural)
      'google', // Google español (Chrome - smooth female)
      'paloma', // Spanish female
      'mónica',
      'monica',
      'sofia',
      'sofía',
      'lucia',
      'lucía',
      'paulina',
      'carmen',
      'dalia',
      'abril',
      'jimena',
      'marisol',
      'helena', // Microsoft Helena (Legacy desktop)
    ]
    const maleNames = [
      'alvaro',
      'álvaro',
      'pablo',
      'jorge',
      'alonso',
      'enrique',
      'raul',
      'raúl',
      'manuel',
      'david',
      'carlos',
      'male',
    ]

    // 2. Natural / Online neural Spanish female voice
    const naturalFemale = spanishVoices.find((v) => {
      const n = v.name.toLowerCase()
      const isNatural = n.includes('natural') || n.includes('online') || n.includes('neural')
      const isFemale = prioritizedFemaleNames.some((fn) => n.includes(fn)) || !maleNames.some((mn) => n.includes(mn))
      return isNatural && isFemale
    })

    // 3. Search female voices in order of priority
    let bestFemaleVoice: SpeechSynthesisVoice | undefined
    for (const nameKey of prioritizedFemaleNames) {
      const match = spanishVoices.find((v) => v.name.toLowerCase().includes(nameKey))
      if (match) {
        bestFemaleVoice = match
        break
      }
    }

    // 4. Any Spanish voice that is not explicitly male
    const anyNonMaleSpanish = spanishVoices.find(
      (v) => !maleNames.some((mn) => v.name.toLowerCase().includes(mn))
    )

    const selectedVoice =
      naturalFemale || bestFemaleVoice || anyNonMaleSpanish || spanishVoices[0] || voices[0]

    if (selectedVoice) {
      this.voice = selectedVoice
      this.notify()
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return []
    const voices = this.synth.getVoices() || []
    return voices.filter((v) => v.lang.startsWith('es'))
  }

  getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.voice
  }

  setVoiceByName(name: string) {
    const voices = this.getAvailableVoices()
    const match = voices.find((v) => v.name === name)
    if (match) {
      this.voice = match
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app_memoria_voice', name)
      }
      this.notify()
    }
  }

  stop() {
    this.generationId++
    if (this.queueTimeoutId !== null) {
      clearTimeout(this.queueTimeoutId)
      this.queueTimeoutId = null
    }
    this.lastSpokenText = ''
    this.lastSpokenTime = 0
    if (this.synth) {
      if (this.currentUtterance) {
        this.currentUtterance.onend = null
        this.currentUtterance.onerror = null
        this.currentUtterance = null
      }
      this.synth.cancel()
    }
  }

  // Softens text, expands currency to conversational Spanish, and strips emojis
  private preprocessText(raw: string): string {
    return raw
      // 1. Expand cent amounts (e.g. "50 c", "20 c") first
      .replace(/\b0,(\d{2})\s*€/g, '$1 céntimos')
      .replace(/\b(\d+)\s*c\b/g, '$1 céntimos')
      // 2. Expand Euro amounts into natural spoken words
      .replace(/\b1,00\s*€/g, '1 euro')
      .replace(/\b1,(\d{2})\s*€/g, '1 euro con $1 céntimos')
      .replace(/(\d+),00\s*€/g, '$1 euros')
      .replace(/(\d+),(\d{2})\s*€/g, '$1 euros con $2 céntimos')
      .replace(/\b1\s*€/g, '1 euro')
      .replace(/(\d+)\s*€/g, '$1 euros')
      // 3. Remove emojis and pictographs so speech synthesizer never makes glitch noises
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      // 4. Clean extra punctuation
      .replace(/\.{3}/g, '.')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Divides text into natural human breathing chunks with dedicated silence between sentences
  private splitIntoChunks(text: string): SpeechChunk[] {
    const cleaned = this.preprocessText(text)
    if (!cleaned) return []

    // Split at sentence boundaries: period, exclamation, question mark, colon, or newline
    const rawSegments = cleaned.split(/(?<=[.!?:\n])\s+/)
    const chunks: SpeechChunk[] = []

    for (const seg of rawSegments) {
      const trimmed = seg.trim()
      if (!trimmed) continue

      // Generous, calm pause so seniors have time to absorb each sentence
      let pauseAfterMs = 450 // standard breathing pause between sentences

      if (trimmed.endsWith(':')) {
        pauseAfterMs = 340
      } else if (trimmed.endsWith('?') || trimmed.endsWith('!')) {
        pauseAfterMs = 480
      } else if (trimmed.endsWith('.')) {
        pauseAfterMs = 450
      }

      chunks.push({ text: trimmed, pauseAfterMs })
    }

    return chunks
  }

  // Speaks text with calm sentence pauses and kind, smiling vocal warmth
  speak(text: string, onEnd?: () => void, overrideVoice?: SpeechSynthesisVoice) {
    if (!this.synth) {
      if (onEnd) onEnd()
      return
    }

    const cleanedRaw = this.preprocessText(text)
    if (!cleanedRaw) {
      if (onEnd) onEnd()
      return
    }

    const now = Date.now()
    // Anti-debounce if already speaking exact text in the last 400ms
    if (
      this.lastSpokenText === cleanedRaw &&
      now - this.lastSpokenTime < 400 &&
      (this.synth.speaking || this.synth.pending)
    ) {
      return
    }
    this.lastSpokenText = cleanedRaw
    this.lastSpokenTime = now

    // Stop ongoing speech and cancel pending chunk timers
    this.stop()

    const chunks = this.splitIntoChunks(text)
    if (chunks.length === 0) {
      if (onEnd) onEnd()
      return
    }

    const currentGen = this.generationId
    if (!this.voice && !overrideVoice) {
      this.initVoices()
    }

    const activeVoice = overrideVoice || this.voice
    let chunkIndex = 0

    const speakNextChunk = () => {
      if (this.generationId !== currentGen || !this.synth) return

      if (chunkIndex >= chunks.length) {
        this.currentUtterance = null
        if (onEnd) {
          onEnd()
        }
        return
      }

      const currentChunk = chunks[chunkIndex]
      chunkIndex++

      if (this.synth.paused) {
        this.synth.resume()
      }

      const utterance = new SpeechSynthesisUtterance(currentChunk.text)
      if (activeVoice) {
        utterance.voice = activeVoice
      }
      utterance.lang = activeVoice ? activeVoice.lang : 'es-ES'

      // Warm, affectionate, friendly prosody:
      // Slightly elevated pitch (1.05) creates a kind, smiling, reassuring tone
      // Rate 0.90 ensures calm, clear, stress-free comprehension
      utterance.rate = 0.90
      utterance.pitch = 1.05
      utterance.volume = 0.90

      this.currentUtterance = utterance

      let chunkDone = false
      const handleDone = () => {
        if (chunkDone || this.generationId !== currentGen) return
        chunkDone = true
        this.currentUtterance = null

        // If this was the last chunk, notify completion immediately
        if (chunkIndex >= chunks.length) {
          if (onEnd) onEnd()
          return
        }

        // True silence pause between sentences so speech never rushes
        this.queueTimeoutId = window.setTimeout(() => {
          this.queueTimeoutId = null
          speakNextChunk()
        }, currentChunk.pauseAfterMs)
      }

      utterance.onend = () => {
        handleDone()
      }

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech chunk error:', e.error)
        }
        handleDone()
      }

      try {
        this.synth.speak(utterance)
        if (this.synth.paused) {
          this.synth.resume()
        }
      } catch (err) {
        console.warn('Failed to speak chunk:', err)
        handleDone()
      }
    }

    speakNextChunk()
  }
}

export const speech = new SpeechService()
