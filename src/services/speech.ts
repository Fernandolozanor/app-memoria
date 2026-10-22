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
  voice: SpeechSynthesisVoice | null
  pitch: number
  rate: number
  useCloudMale?: boolean
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

const CATEGORIES_LIST = [
  'las frutas',
  'los animales',
  'los medios de transporte',
  'las prendas de ropa',
  'las herramientas',
  'los muebles de la casa',
  'los instrumentos musicales',
  'las flores y plantas',
  'los utensilios de cocina',
  'las partes del cuerpo',
  'los fenómenos del tiempo',
  'el material escolar',
  'los deportes',
  'los postres y dulces',
  'los electrodomésticos',
]

const WHERE_ITEMS_LIST = [
  { key: 'las-gafas', name: 'las gafas' },
  { key: 'las-llaves', name: 'las llaves' },
  { key: 'el-monedero', name: 'el monedero' },
  { key: 'el-reloj', name: 'el reloj' },
  { key: 'el-libro', name: 'el libro' },
  { key: 'la-taza-de-cafe', name: 'la taza de café' },
  { key: 'el-telefono', name: 'el teléfono' },
  { key: 'el-paraguas', name: 'el paraguas' },
  { key: 'la-libreta', name: 'la libreta' },
  { key: 'la-cartera', name: 'la cartera' },
  { key: 'el-anillo', name: 'el anillo' },
  { key: 'el-pastillero', name: 'el pastillero' },
  { key: 'el-sombrero', name: 'el sombrero' },
  { key: 'la-radio', name: 'la radio' },
  { key: 'las-tijeras', name: 'las tijeras' },
  { key: 'la-vela', name: 'la vela' },
  { key: 'la-campana', name: 'la campana' },
  { key: 'la-guitarra', name: 'la guitarra' },
  { key: 'el-regalo', name: 'el regalo' },
  { key: 'la-carta', name: 'la carta' },
  { key: 'los-zapatos', name: 'los zapatos' },
  { key: 'la-flor', name: 'la flor' },
  { key: 'la-manzana', name: 'la manzana' },
  { key: 'el-pan', name: 'el pan' },
  { key: 'el-queso', name: 'el queso' },
  { key: 'la-camara', name: 'la cámara' },
  { key: 'la-linterna', name: 'la linterna' },
  { key: 'el-peine', name: 'el peine' },
]

const PEOPLE_LIST = [
  'Carmen',
  'Manuel',
  'Teresa',
  'Francisco',
  'Pilar',
  'José',
  'Dolores',
  'Rafael',
  'Aïcha',
  'Mamadou',
  'Mercedes',
  'Antonio',
  'Pedro',
  'Isabel',
  'Javier',
  'Fátima',
  'Amadou',
  'Marta',
  'Carlos',
  'Rosa',
  'Kenji',
  'Mei',
  'Samuel',
  'Lucía',
  'David',
  'Elena',
  'Alberto',
  'Clara',
  'Lucas',
  'Mariama',
]

function slugifyKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

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
  private audioCtx: AudioContext | null = null
  private activeSource: AudioBufferSourceNode | null = null
  private activeHtmlAudio: HTMLAudioElement | null = null
  private staticBufferCache = new Map<string, AudioBuffer>()

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.getAudioContext()
      }
      window.addEventListener('pointerdown', unlock, { passive: true })
      window.addEventListener('touchstart', unlock, { passive: true })
      window.addEventListener('click', unlock, { passive: true })
    }
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

    // Ensure there is ALWAYS a genuine, warm, gentle male voice option ("Carlos")
    // Served from local static MP3 assets so it works 100% on iPhone & Spanish 5G without ever falling back to female TTS
    const existingCarlosIdx = result.findIndex((p) => p.id === 'carlos' || p.id === 'carlos-male')
    if (existingCarlosIdx !== -1) {
      result[existingCarlosIdx].useCloudMale = true
    } else {
      result.push({
        id: 'carlos-male',
        title: 'Carlos',
        tag: 'Voz de hombre suave, amable y agradable',
        gender: 'M',
        voice: null,
        pitch: 0.92,
        rate: 0.90,
        useCloudMale: true,
      })
    }

    return result
  }

  private resolveCarlosStaticAudio(rawText: string): string {
    const t = rawText.toLowerCase().trim()

    // 1. Voice modal test
    if (t.includes('leeré las instrucciones') || t.includes('te gusta cómo suena')) {
      return 'test-voice'
    }

    // 2. Celebrations
    if (t.includes('compra completada')) return 'celebration-shopping'
    if (t.includes('todas las parejas con gran memoria')) return 'celebration-pairs'
    if (t.includes('todos los refranes populares')) return 'celebration-sayings'
    if (t.includes('objeto diferente superando')) return 'celebration-spot'
    if (t.includes('todos los intrusos')) return 'celebration-odd'
    if (t.includes('posición de los objetos')) return 'celebration-where'
    if (t.includes('rondas del piano')) return 'celebration-piano'
    if (t.includes('gran organización')) return 'celebration-steps'
    if (t.includes('todas las caras con gran agudeza')) return 'celebration-faces'
    if (t.includes('cuentas perfectas')) return 'celebration-coins'
    if (t.includes('has completado')) return 'celebration-default'

    // 3. Sweet Piano
    if (t.includes('ronda 1') && t.includes('nota')) return 'piano-r1'
    if (t.includes('ronda 2') && t.includes('notas')) return 'piano-r2'
    if (t.includes('ronda 3') && t.includes('notas')) return 'piano-r3'
    if (t.includes('ronda 4') && t.includes('verde')) return 'piano-r4'
    if (
      t.includes('tu turno') ||
      t.includes('te toca') ||
      t.includes('repite la melodía') ||
      t.includes('toca las teclas')
    ) {
      return 'piano-turn'
    }
    if (
      t.includes('oído musical') ||
      t.includes('sonado a gloria') ||
      t.includes('clavado la melodía') ||
      t.includes('gran músico') ||
      t.includes('nota por nota')
    ) {
      return 'piano-success'
    }
    if (
      t.includes('escucha de nuevo la melodía') ||
      t.includes('escucha otra vez con atención') ||
      t.includes('vuelve a escuchar las notas') ||
      t.includes('sonar otra vez')
    ) {
      return 'piano-retry'
    }

    // 4. Spot Object
    if (t.includes('6 tarjetas') && (t.includes('diferente') || t.includes('igual') || t.includes('distinto'))) {
      return 'spot-intro-6'
    }
    if (t.includes('9 tarjetas') && (t.includes('diferente') || t.includes('igual') || t.includes('distinto'))) {
      return 'spot-intro-9'
    }
    if (t.includes('12 tarjetas') && (t.includes('diferente') || t.includes('igual') || t.includes('distinto'))) {
      return 'spot-intro-12'
    }
    if (
      t.includes('dónde estaba el objeto diferente') ||
      t.includes('cuál era el dibujo distinto') ||
      t.includes('en qué tarjeta estaba el que no era igual') ||
      t.includes('dónde estaba el dibujo diferente')
    ) {
      return 'spot-guessing'
    }
    if (
      t.includes('ahí estaba el diferente') ||
      t.includes('no cuadraba con los demás') ||
      t.includes('vista de lince') ||
      t.includes('encontrado el dibujo diferente') ||
      t.includes('al instante')
    ) {
      return 'spot-correct'
    }
    if (
      t.includes('no era la diferente') ||
      t.includes('no estaba el distinto') ||
      t.includes('igual que las otras') ||
      t.includes('dibujo se repite')
    ) {
      return 'spot-wrong'
    }

    // 5. Memory Pairs
    if (
      t.includes('parejas de dibujos iguales') ||
      t.includes('dos cosas iguales') ||
      t.includes('dónde están las parejas') ||
      t.includes('emparejar las cartas')
    ) {
      return 'pairs-intro'
    }
    if (
      t.includes('todas las parejas') ||
      t.includes('completado todas las parejas') ||
      t.includes('tablero completado')
    ) {
      return 'pairs-all'
    }
    if (
      t.includes('encontrado la pareja') ||
      t.includes('otra pareja') ||
      t.includes('ya tienes') ||
      t.includes('pareja de')
    ) {
      return 'pairs-found'
    }

    // 6. Shopping List
    if (t.includes('recuerda estos 2 alimentos')) return 'shop-mem-2'
    if (t.includes('recuerda estos 3 alimentos')) return 'shop-mem-3'
    if (t.includes('grábate estos 4 alimentos') || t.includes('recuerda estos 4 alimentos')) {
      return 'shop-mem-4'
    }
    if (t.includes('2 productos de la primera lista')) return 'shop-rec-2'
    if (t.includes('3 productos de esta segunda lista')) return 'shop-rec-3'
    if (t.includes('4 alimentos de esta última lista')) return 'shop-rec-4'
    if (
      t.includes('primera compra lista') ||
      t.includes('segunda lista completada') ||
      t.includes('has recordado las tres listas')
    ) {
      return 'shop-round-ok'
    }
    if (
      t.includes('no estaba en la lista') ||
      t.includes('no nos hacía falta') ||
      t.includes('no tocaba comprarlo') ||
      t.includes('no venía apuntado')
    ) {
      return 'shop-wrong'
    }
    if (t.startsWith('¡muy bien,')) return 'shop-item-ok'

    // 7. Odd One Out
    if (
      t.includes('no pertenece') ||
      t.includes('intruso') ||
      t.includes('no tiene nada que ver') ||
      t.includes('se ha colado') ||
      t.includes('misma familia') ||
      t.includes('sí pertenece') ||
      t.includes('sí encaja') ||
      t.includes('no encajaba con el resto')
    ) {
      if (
        t.startsWith('¡correcto!') ||
        t.startsWith('¡bien visto!') ||
        t.startsWith('¡exacto!') ||
        t.startsWith('¡lo cazaste!')
      ) {
        return 'odd-correct'
      }
      if (t.includes('sí pertenece') || t.includes('misma familia') || t.includes('sí encaja')) {
        return 'odd-wrong'
      }
      for (const cat of CATEGORIES_LIST) {
        if (t.includes(cat)) {
          return 'odd-intro-' + slugifyKey(cat)
        }
      }
      return 'odd-correct'
    }

    // 8. Where Was It
    if (t.includes('9 tarjetas') && t.includes('3')) return 'where-intro-9'
    if (t.includes('12 tarjetas') && t.includes('4')) return 'where-intro-12'
    if (t.includes('16 tarjetas') && t.includes('5')) return 'where-intro-16'
    if (t.includes('3 objetos') || t.includes('3 casillas')) return 'where-show-3'
    if (t.includes('4 objetos') || t.includes('4 casillas')) return 'where-show-4'
    if (t.includes('5 objetos') || t.includes('5 casillas')) return 'where-show-5'
    if (t.includes('¿dónde') || t.includes('en qué casilla') || t.includes('a ver esa memoria')) {
      for (const it of WHERE_ITEMS_LIST) {
        if (t.includes(it.name)) {
          return 'where-guess-' + it.key
        }
      }
    }
    if (
      t.includes('justo ahí estaba') ||
      t.includes('justo ahí estaban') ||
      t.includes('recordaste dónde') ||
      t.includes('no se te escapa una')
    ) {
      return 'where-correct'
    }
    if (
      t.includes('ahí no estaba') ||
      t.includes('ahí no estaban') ||
      t.includes('en esa casilla no') ||
      t.includes('por ahí no') ||
      t.includes('busca dónde estaba') ||
      t.includes('busca dónde estaban')
    ) {
      return 'where-wrong'
    }

    // 9. Faces and Names
    if (t.includes('pulsa jugar') || t.includes('botón de jugar') || t.includes('toca jugar')) {
      return 'faces-play'
    }
    if (
      t.includes('esa es la cara de') ||
      t.includes('reconociste a') ||
      t.includes('memoria para las caras')
    ) {
      return 'faces-correct'
    }
    if (
      t.includes('esa cara es de') ||
      t.includes('esa persona es') ||
      t.includes('queremos encontrar a')
    ) {
      return 'faces-wrong'
    }
    if (
      t.includes('¿quién es') ||
      t.includes('¿dónde está la cara') ||
      t.includes('¿reconoces a') ||
      t.includes('busca la cara de')
    ) {
      for (const p of PEOPLE_LIST) {
        if (t.includes(p.toLowerCase())) {
          return 'faces-guess-' + slugifyKey(p)
        }
      }
    }
    if (
      t.includes('rasgos') ||
      t.includes('recuerda su cara') ||
      t.includes('grábate su rostro') ||
      t.includes('mírale bien')
    ) {
      for (const p of PEOPLE_LIST) {
        if (t.includes(p.toLowerCase())) {
          return 'faces-intro-' + slugifyKey(p)
        }
      }
    }

    // 10. Sayings
    if (
      (t.includes('refrán') &&
        (t.includes('completa') ||
          t.includes('suena') ||
          t.includes('cómo sigue') ||
          t.includes('oído muchas veces'))) ||
      t.includes('dicho popular')
    ) {
      return 'sayings-intro'
    }
    if (
      t.includes('sabiduría popular') ||
      t.includes('al dedillo') ||
      t.includes('lleno de razón') ||
      t.includes('así se dice') ||
      t.includes('bien dicho está')
    ) {
      return 'sayings-correct'
    }
    if (
      t.includes('no rima con este refrán') ||
      t.includes('la tradición dice otra cosa') ||
      t.includes('no es el final de este dicho')
    ) {
      return 'sayings-wrong'
    }

    // 11. Step Order
    if (
      t.includes('primer lugar') ||
      t.includes('primer paso') ||
      t.includes('con qué empezamos')
    ) {
      return 'steps-first'
    }
    if (t.includes('paso número 2') || t.includes('paso 2')) return 'steps-next-2'
    if (t.includes('paso número 3') || t.includes('paso 3')) return 'steps-next-3'
    if (t.includes('paso número 4') || t.includes('paso 4')) return 'steps-next-4'
    if (t.includes('paso número 5') || t.includes('paso 5')) return 'steps-next-5'
    if (t.includes('qué paso toca') || t.includes('después de eso')) return 'steps-next-2'
    if (
      t.includes('bien ordenado') ||
      t.includes('perfectamente organizados') ||
      t.includes('cosas bien hechas') ||
      t.includes('así es exactamente como se hace')
    ) {
      return 'steps-completed'
    }
    if (
      t.includes('ese paso va más adelante') ||
      t.includes('todavía no toca') ||
      t.includes('antes de eso')
    ) {
      return 'steps-wrong'
    }

    // 12. Daily Coins
    if (t.includes('junta exactamente 2 monedas')) return 'coins-intro-2'
    if (t.includes('junta exactamente 3 monedas')) return 'coins-intro-3'
    if (t.includes('junta exactamente 4 monedas')) return 'coins-intro-4'
    if (t.includes('junta exactamente 5 monedas')) return 'coins-intro-5'
    if (t.includes('ya tienes') && t.includes('monedas')) return 'coins-max'
    if (
      t.includes('pasado de precio') ||
      t.includes('suma más de la cuenta') ||
      t.includes('pasado del total')
    ) {
      return 'coins-over'
    }
    if (
      t.includes('no dan el precio justo') ||
      t.includes('no coincide exactamente') ||
      t.includes('total no es el exacto')
    ) {
      return 'coins-wrong'
    }
    if (
      t.includes('monedas retiradas') ||
      t.includes('bandeja limpia') ||
      t.includes('empezamos de nuevo con este producto')
    ) {
      return 'coins-reset'
    }
    if (
      t.includes('importe exacto') ||
      t.includes('clavado al céntimo') ||
      t.includes('bien calculado') ||
      t.includes('monedero funciona')
    ) {
      return 'coins-correct'
    }

    return 'celebration-default'
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.audioCtx = new AudioCtx()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  private playStaticCarlosAudio(fileId: string, onDone: () => void, genId: number) {
    if (this.generationId !== genId) return
    const url = `./audio/carlos/${fileId}.mp3`

    const ctx = this.getAudioContext()
    const cachedBuffer = this.staticBufferCache.get(fileId)
    if (ctx && cachedBuffer) {
      this.startBufferSource(ctx, cachedBuffer, onDone, genId)
      return
    }

    if (ctx) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Audio fetch failed')
          return res.arrayBuffer()
        })
        .then((arrayBuffer) => {
          if (this.generationId !== genId) return
          ctx.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
              this.staticBufferCache.set(fileId, audioBuffer)
              if (this.generationId !== genId) return
              this.startBufferSource(ctx, audioBuffer, onDone, genId)
            },
            () => {
              this.playUrlWithHtmlAudio(url, onDone, genId)
            }
          )
        })
        .catch(() => {
          this.playUrlWithHtmlAudio(url, onDone, genId)
        })
      return
    }

    this.playUrlWithHtmlAudio(url, onDone, genId)
  }

  private startBufferSource(
    ctx: AudioContext,
    audioBuffer: AudioBuffer,
    onDone: () => void,
    genId: number
  ) {
    if (this.generationId !== genId) return
    try {
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      // Slightly slower playback (0.93) gives a softer, calmer, warmer baritone male voice
      source.playbackRate.value = 0.93

      // Gentle low-pass filter to soften high frequencies and make the voice warm and pleasant
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 3600

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.95

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)

      this.activeSource = source
      source.onended = () => {
        if (this.activeSource === source) {
          this.activeSource = null
        }
        onDone()
      }
      source.start(0)
    } catch {
      onDone()
    }
  }

  private playUrlWithHtmlAudio(url: string, onDone: () => void, genId: number) {
    if (this.generationId !== genId) return
    try {
      const audio = new Audio(url)
      audio.playbackRate = 0.93
      audio.preservesPitch = false
      this.activeHtmlAudio = audio
      audio.onended = () => {
        if (this.activeHtmlAudio === audio) this.activeHtmlAudio = null
        onDone()
      }
      audio.onerror = () => {
        if (this.activeHtmlAudio === audio) this.activeHtmlAudio = null
        onDone()
      }
      audio.play().catch(() => {
        onDone()
      })
    } catch {
      onDone()
    }
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

    // 1. Respect user's saved profile ID (including legacy 'carlos' -> 'carlos-male')
    if (storedProfileId) {
      const normalizedId = storedProfileId === 'carlos' ? 'carlos-male' : storedProfileId
      const saved = this.profiles.find((p) => p.id === normalizedId || p.id === storedProfileId)
      if (saved) {
        this.currentProfile = saved
        this.notify()
        return
      }
    }

    // 2. Migrate legacy voice name if present
    if (legacyVoiceName) {
      const savedLegacy = this.profiles.find((p) => p.voice && p.voice.name === legacyVoiceName)
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
    if (this.activeSource) {
      try {
        this.activeSource.onended = null
        this.activeSource.stop()
      } catch {
        // ignore
      }
      this.activeSource = null
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.onended = null
        this.activeHtmlAudio.onerror = null
        this.activeHtmlAudio.pause()
      } catch {
        // ignore
      }
      this.activeHtmlAudio = null
    }
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
    const useCloudMale = Boolean(activeProfile && activeProfile.useCloudMale)

    // When Carlos (male voice) is selected, play the pre-generated static MP3 from our own server
    // Never fall back to female SpeechSynthesis voices
    if (useCloudMale) {
      const fileId = this.resolveCarlosStaticAudio(cleanedRaw)
      this.playStaticCarlosAudio(
        fileId,
        () => {
          if (this.generationId !== currentGen) return
          if (onEnd) onEnd()
        },
        currentGen
      )
      return
    }

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

      this.speakChunkWithWebSpeech(
        currentChunk.text,
        activeVoice,
        activeRate,
        activePitch,
        handleDone
      )
    }

    speakNextChunk()
  }

  private speakChunkWithWebSpeech(
    text: string,
    activeVoice: SpeechSynthesisVoice | null,
    activeRate: number,
    activePitch: number,
    handleDone: () => void
  ) {
    if (!this.synth) {
      handleDone()
      return
    }
    if (this.synth.paused) {
      this.synth.resume()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    if (activeVoice) {
      utterance.voice = activeVoice
    }
    utterance.lang = activeVoice ? activeVoice.lang : 'es-ES'

    utterance.rate = activeRate
    utterance.pitch = activePitch
    utterance.volume = 0.90

    this.currentUtterance = utterance

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
}

export const speech = new SpeechService()
