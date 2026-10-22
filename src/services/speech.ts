// Web Speech API service for reading prompts and instructions aloud in Spanish
// Uses Mónica by default with human-paced sentence chunking and warm prosody

export interface SpeechChunk {
  text: string
  pauseAfterMs: number
}

const NOVELTY_VOICES = [
  'flo',
  'grandpa',
  'grandma',
  'rocko',
  'sandy',
  'shelley',
  'albert',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'jester',
  'organ',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
  'reed',
  'eddy',
]

class SpeechService {
  private synth: SpeechSynthesis | null = null
  private selectedVoice: SpeechSynthesisVoice | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private queueTimeoutId: number | null = null
  private generationId = 0
  private lastSpokenText = ''
  private lastSpokenTime = 0

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      // Clean up any legacy stored voice selection so Mónica is always used by default
      try {
        localStorage.removeItem('app_memoria_voice_profile')
        localStorage.removeItem('app_memoria_voice')
      } catch {
        // ignore
      }
      this.initVoices()
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.initVoices()
        }
      }
    }
  }

  private getVoiceQualityScore(v: SpeechSynthesisVoice): number {
    const n = `${v.name} ${v.voiceURI}`.toLowerCase()
    let score = 0
    if (n.includes('mónica') || n.includes('monica')) score += 100
    if (n.includes('natural') || n.includes('neural') || n.includes('online')) score += 20
    if (n.includes('enhanced') || n.includes('premium') || n.includes('mejorada')) score += 15
    if (v.lang.toLowerCase().includes('es-es') || v.lang.toLowerCase().includes('es_es')) score += 10
    if (v.localService) score += 2
    if (v.default) score += 1
    return score
  }

  private initVoices() {
    if (!this.synth) return
    const voices = this.synth.getVoices()
    if (!voices || voices.length === 0) return

    const spanishVoices = voices
      .filter((v) => v.lang.toLowerCase().startsWith('es'))
      .filter((v) => {
        const n = v.name.toLowerCase()
        return !NOVELTY_VOICES.some((nov) => n.includes(nov))
      })

    const pool = spanishVoices.length > 0 ? spanishVoices : voices

    // Sort by quality score, putting Mónica at the very top
    const sorted = [...pool].sort(
      (a, b) => this.getVoiceQualityScore(b) - this.getVoiceQualityScore(a)
    )

    this.selectedVoice = sorted[0] || null
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
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

  // Estimates the spoken duration (in ms) of a text including sentence pauses
  estimateDurationMs(text: string): number {
    const chunks = this.splitIntoChunks(text)
    if (chunks.length === 0) return 0

    let totalMs = 250 // initial synthesizer warm-up buffer
    chunks.forEach((chunk, idx) => {
      // At rate 0.90, Spanish speech averages ~78ms per character + 220ms utterance overhead
      totalMs += chunk.text.length * 78 + 220
      if (idx < chunks.length - 1) {
        totalMs += chunk.pauseAfterMs
      }
    })
    return totalMs
  }

  // Speaks text with Mónica's voice, calm sentence pauses, and kind vocal warmth
  speak(text: string, onEnd?: () => void) {
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
    if (!this.selectedVoice) {
      this.initVoices()
    }

    const activeVoice = this.selectedVoice
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
