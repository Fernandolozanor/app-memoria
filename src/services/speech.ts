// Web Speech API service for reading prompts and instructions aloud in Spanish
// Features human-paced sentence & punctuation chunking, warm prosody, and friendly voice selection

export interface SpeechChunk {
  text: string
  pauseAfterMs: number
}

export interface VoiceProfile {
  id: string
  title: string
  tag: string
  gender: 'F' | 'M'
  voice: SpeechSynthesisVoice
  pitch: number
  rate: number
}

const NOVELTY_VOICES = [
  'flo',
  'grandpa',
  'grandma',
  'rocko',
  'sandy',
  'shelley',
  'Albert',
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
]

class SpeechService {
  private synth: SpeechSynthesis | null = null
  private profiles: VoiceProfile[] = []
  private currentProfile: VoiceProfile | null = null
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

  private getVoiceQualityScore(v: SpeechSynthesisVoice): number {
    const n = `${v.name} ${v.voiceURI}`.toLowerCase()
    let score = 0
    if (n.includes('natural') || n.includes('neural') || n.includes('online')) score += 20
    if (n.includes('enhanced') || n.includes('premium') || n.includes('mejorada')) score += 15
    if (v.lang.toLowerCase().includes('es-es') || v.lang.toLowerCase().includes('es_es')) score += 8
    if (v.localService) score += 2
    if (v.default) score += 1
    return score
  }

  private classifyVoice(v: SpeechSynthesisVoice): {
    key: string
    title: string
    tag: string
    gender: 'F' | 'M'
  } | null {
    const n = v.name.toLowerCase()

    if (NOVELTY_VOICES.some((nov) => n.includes(nov.toLowerCase()))) {
      return null
    }

    // Female voices
    if (n.includes('laura')) {
      return { key: 'laura', title: 'Laura', tag: 'Cálida, dulce y natural', gender: 'F' }
    }
    if (n.includes('elvira')) {
      return { key: 'elvira', title: 'Elvira', tag: 'Muy suave y afectuosa', gender: 'F' }
    }
    if (n.includes('mónica') || n.includes('monica')) {
      return { key: 'monica', title: 'Mónica', tag: 'Amable y agradable', gender: 'F' }
    }
    if (n.includes('paulina')) {
      return { key: 'paulina', title: 'Paulina', tag: 'Dulce y cercana', gender: 'F' }
    }
    if (n.includes('paloma')) {
      return { key: 'paloma', title: 'Paloma', tag: 'Voz suave y clara', gender: 'F' }
    }
    if (n.includes('helena')) {
      return { key: 'helena', title: 'Helena', tag: 'Clara y tradicional', gender: 'F' }
    }
    if (n.includes('sabina')) {
      return { key: 'sabina', title: 'Sabina', tag: 'Suave y pausada', gender: 'F' }
    }
    if (n.includes('dalia')) {
      return { key: 'dalia', title: 'Dalia', tag: 'Cálida y amable', gender: 'F' }
    }
    if (n.includes('sofia') || n.includes('sofía')) {
      return { key: 'sofia', title: 'Sofía', tag: 'Amable y clara', gender: 'F' }
    }
    if (n.includes('lucia') || n.includes('lucía')) {
      return { key: 'lucia', title: 'Lucía', tag: 'Dulce y agradable', gender: 'F' }
    }
    if (n.includes('carmen')) {
      return { key: 'carmen', title: 'Carmen', tag: 'Cercana y clara', gender: 'F' }
    }
    if (n.includes('marisol')) {
      return { key: 'marisol', title: 'Marisol', tag: 'Suave y expresiva', gender: 'F' }
    }
    if (n.includes('google')) {
      return { key: 'google', title: 'Elena', tag: 'Voz fluida y amable', gender: 'F' }
    }

    // Male voices
    if (n.includes('alvaro') || n.includes('álvaro')) {
      return {
        key: 'alvaro',
        title: 'Álvaro',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('jorge')) {
      return {
        key: 'jorge',
        title: 'Jorge',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('pablo')) {
      return {
        key: 'pablo',
        title: 'Pablo',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('juan')) {
      return {
        key: 'juan',
        title: 'Juan',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('diego')) {
      return {
        key: 'diego',
        title: 'Diego',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('carlos')) {
      return {
        key: 'carlos',
        title: 'Carlos',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('alonso')) {
      return {
        key: 'alonso',
        title: 'Alonso',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('enrique')) {
      return {
        key: 'enrique',
        title: 'Enrique',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('raul') || n.includes('raúl')) {
      return {
        key: 'raul',
        title: 'Raúl',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }
    if (n.includes('reed') || n.includes('eddy')) {
      return {
        key: 'carlos',
        title: 'Carlos',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
      }
    }

    // Generic fallback cleaned up so duplicates with suffixes collapse into one key
    const cleanTitle = v.name
      .replace(/Microsoft |Google |Apple /gi, '')
      .replace(/Online \(Natural\)/gi, '')
      .replace(/\(.*?\)/g, '')
      .replace(/-.*$/g, '')
      .trim()

    const key = cleanTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!key) return null

    return {
      key,
      title: cleanTitle,
      tag: 'Amable y clara',
      gender: 'F',
    }
  }

  private buildProfiles(spanishVoices: SpeechSynthesisVoice[]): VoiceProfile[] {
    // Deduplicate by key, keeping only the highest quality SpeechSynthesisVoice for each name
    const bestByKey = new Map<
      string,
      {
        meta: { key: string; title: string; tag: string; gender: 'F' | 'M' }
        voice: SpeechSynthesisVoice
        score: number
      }
    >()

    for (const v of spanishVoices) {
      const meta = this.classifyVoice(v)
      if (!meta) continue

      const score = this.getVoiceQualityScore(v)
      const existing = bestByKey.get(meta.key)
      if (!existing || score > existing.score) {
        bestByKey.set(meta.key, { meta, voice: v, score })
      }
    }

    const result: VoiceProfile[] = []
    for (const { meta, voice } of bestByKey.values()) {
      result.push({
        id: meta.key,
        title: meta.title,
        tag: meta.tag,
        gender: meta.gender,
        voice,
        pitch: meta.gender === 'M' ? 0.96 : 1.05,
        rate: meta.gender === 'M' ? 0.89 : 0.90,
      })
    }

    // Sort: Female voices first (prioritizing Mónica, Laura, Elvira, Paulina), then Male voices
    const femaleOrder = ['laura', 'elvira', 'monica', 'paulina', 'paloma', 'helena', 'google']
    result.sort((a, b) => {
      if (a.gender !== b.gender) return a.gender === 'F' ? -1 : 1
      const idxA = femaleOrder.indexOf(a.id)
      const idxB = femaleOrder.indexOf(b.id)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.title.localeCompare(b.title, 'es')
    })

    // Ensure there is ALWAYS at least one gentle, warm, pleasant male voice option
    const hasMale = result.some((p) => p.gender === 'M')
    if (!hasMale && result.length > 0) {
      const baseVoice = result[0].voice
      result.push({
        id: 'carlos-male',
        title: 'Carlos',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
        voice: baseVoice,
        pitch: 0.68, // Warm, natural male baritone pitch
        rate: 0.88, // Calm, gentle, unhurried pace
      })
    }

    return result
  }

  private initVoices() {
    if (!this.synth) return
    const voices = this.synth.getVoices()
    if (!voices || voices.length === 0) return

    const spanishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('es'))
    const pool = spanishVoices.length > 0 ? spanishVoices : voices

    this.profiles = this.buildProfiles(pool)
    if (this.profiles.length === 0) return

    const storedProfileId =
      typeof localStorage !== 'undefined' ? localStorage.getItem('app_memoria_voice_profile') : null
    const legacyVoiceName =
      typeof localStorage !== 'undefined' ? localStorage.getItem('app_memoria_voice') : null

    // 1. Respect user's saved profile ID
    if (storedProfileId) {
      const saved = this.profiles.find((p) => p.id === storedProfileId)
      if (saved) {
        this.currentProfile = saved
        this.notify()
        return
      }
    }

    // 2. Migrate legacy voice name if present
    if (legacyVoiceName) {
      const savedLegacy = this.profiles.find((p) => p.voice.name === legacyVoiceName)
      if (savedLegacy) {
        this.currentProfile = savedLegacy
        this.notify()
        return
      }
    }

    // 3. Default to the first (best) profile
    this.currentProfile = this.profiles[0]
    this.notify()
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getAvailableVoiceProfiles(): VoiceProfile[] {
    if (this.profiles.length === 0 && this.synth) {
      this.initVoices()
    }
    return this.profiles
  }

  getCurrentProfile(): VoiceProfile | null {
    return this.currentProfile
  }

  setProfileById(id: string) {
    const match = this.profiles.find((p) => p.id === id)
    if (match) {
      this.currentProfile = match
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app_memoria_voice_profile', id)
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

  // Speaks text with calm sentence pauses and kind, smiling vocal warmth
  speak(text: string, onEnd?: () => void, overrideProfile?: VoiceProfile) {
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
      !overrideProfile &&
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
    if (!this.currentProfile && !overrideProfile) {
      this.initVoices()
    }

    const activeProfile = overrideProfile || this.currentProfile
    const activeVoice = activeProfile ? activeProfile.voice : null
    const activeRate = activeProfile ? activeProfile.rate : 0.90
    const activePitch = activeProfile ? activeProfile.pitch : 1.05
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

      // Warm, affectionate, friendly prosody adapted to the chosen profile (female or male)
      utterance.rate = activeRate
      utterance.pitch = activePitch
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
