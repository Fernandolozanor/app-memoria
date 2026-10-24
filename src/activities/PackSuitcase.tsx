import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_PRAISES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface PackItem {
  id: string
  name: string
  emoji: string
}

interface Scenario {
  title: string
  emoji: string
  correctItems: PackItem[]
  wrongItems: PackItem[]
}

const INTRO_VOICES = [
  (title: string, n: number) => `${title}. Toca las ${n} cosas que necesitamos llevar.`,
  (title: string, n: number) => `Nos preparamos para: ${title}. Elige ${n} objetos adecuados.`,
  (title: string, n: number) => `Vamos con: ${title}. Señala los ${n} dibujos que nos hacen falta.`,
]

// 12 escenarios variados con amplios catálogos de objetos e iconos 100% universales
const SCENARIOS: Scenario[] = [
  {
    title: 'Día de playa y sol',
    emoji: '🏖️',
    correctItems: [
      { id: 'pl-1', name: 'Gafas de sol', emoji: '🕶️' },
      { id: 'pl-2', name: 'Sombrilla', emoji: '⛱️' },
      { id: 'pl-3', name: 'Bañador', emoji: '👙' },
      { id: 'pl-4', name: 'Pamela de sol', emoji: '👒' },
      { id: 'pl-5', name: 'Sandalias', emoji: '👡' },
      { id: 'pl-6', name: 'Helado fresquito', emoji: '🍦' },
      { id: 'pl-7', name: 'Sandía fresca', emoji: '🍉' },
    ],
    wrongItems: [
      { id: 'pl-w1', name: 'Esquís de nieve', emoji: '🎿' },
      { id: 'pl-w2', name: 'Muñeco de nieve', emoji: '⛄' },
      { id: 'pl-w3', name: 'Sartén', emoji: '🍳' },
      { id: 'pl-w4', name: 'Paraguas de lluvia', emoji: '☔' },
      { id: 'pl-w5', name: 'Botas de invierno', emoji: '👢' },
      { id: 'pl-w6', name: 'Martillo', emoji: '🔨' },
      { id: 'pl-w7', name: 'Despertador', emoji: '⏰' },
    ],
  },
  {
    title: 'Excursión a la nieve',
    emoji: '🏔️',
    correctItems: [
      { id: 'nv-1', name: 'Esquís', emoji: '🎿' },
      { id: 'nv-2', name: 'Botas altas', emoji: '👢' },
      { id: 'nv-3', name: 'Termo de café', emoji: '☕' },
      { id: 'nv-4', name: 'Sombrero de abrigo', emoji: '🎩' },
      { id: 'nv-5', name: 'Muñeco de nieve', emoji: '⛄' },
      { id: 'nv-6', name: 'Sopa caliente', emoji: '🍲' },
    ],
    wrongItems: [
      { id: 'nv-w1', name: 'Sandalias', emoji: '👡' },
      { id: 'nv-w2', name: 'Bañador', emoji: '👙' },
      { id: 'nv-w3', name: 'Sandía', emoji: '🍉' },
      { id: 'nv-w4', name: 'Helado frío', emoji: '🍦' },
      { id: 'nv-w5', name: 'Sombrilla de playa', emoji: '⛱️' },
      { id: 'nv-w6', name: 'Pez de colores', emoji: '🐟' },
    ],
  },
  {
    title: 'Hacer tortilla de patatas',
    emoji: '🍳',
    correctItems: [
      { id: 'tp-1', name: 'Huevos frescos', emoji: '🥚' },
      { id: 'tp-2', name: 'Patatas', emoji: '🥔' },
      { id: 'tp-3', name: 'Sartén', emoji: '🍳' },
      { id: 'tp-4', name: 'Cuchillo de cocina', emoji: '🔪' },
      { id: 'tp-5', name: 'Plato grande', emoji: '🍽️' },
      { id: 'tp-6', name: 'Pan de barra', emoji: '🥖' },
    ],
    wrongItems: [
      { id: 'tp-w1', name: 'Martillo', emoji: '🔨' },
      { id: 'tp-w2', name: 'Zapato', emoji: '👞' },
      { id: 'tp-w3', name: 'Libro', emoji: '📖' },
      { id: 'tp-w4', name: 'Paraguas', emoji: '☂️' },
      { id: 'tp-w5', name: 'Despertador', emoji: '⏰' },
      { id: 'tp-w6', name: 'Guitarra', emoji: '🎸' },
    ],
  },
  {
    title: 'Día de lluvia en la calle',
    emoji: '🌧️',
    correctItems: [
      { id: 'll-1', name: 'Paraguas abierto', emoji: '☂️' },
      { id: 'll-2', name: 'Botas de agua', emoji: '👢' },
      { id: 'll-3', name: 'Sombrero', emoji: '🎩' },
      { id: 'll-4', name: 'Paraguas plegado', emoji: '🌂' },
      { id: 'll-5', name: 'Ir en taxi', emoji: '🚕' },
      { id: 'll-6', name: 'Autobús cubierto', emoji: '🚌' },
    ],
    wrongItems: [
      { id: 'll-w1', name: 'Helado', emoji: '🍦' },
      { id: 'll-w2', name: 'Bañador', emoji: '👙' },
      { id: 'll-w3', name: 'Tijeras', emoji: '✂️' },
      { id: 'll-w4', name: 'Sartén', emoji: '🍳' },
      { id: 'll-w5', name: 'Cama', emoji: '🛏️' },
      { id: 'll-w6', name: 'Sombrilla de playa', emoji: '⛱️' },
    ],
  },
  {
    title: 'Preparar un buen desayuno',
    emoji: '☕',
    correctItems: [
      { id: 'ds-1', name: 'Taza de café', emoji: '☕' },
      { id: 'ds-2', name: 'Cruasán', emoji: '🥐' },
      { id: 'ds-3', name: 'Vaso de leche', emoji: '🥛' },
      { id: 'ds-4', name: 'Tostada de pan', emoji: '🍞' },
      { id: 'ds-5', name: 'Naranja para zumo', emoji: '🍊' },
      { id: 'ds-6', name: 'Tarro de miel', emoji: '🍯' },
      { id: 'ds-7', name: 'Galletas', emoji: '🍪' },
    ],
    wrongItems: [
      { id: 'ds-w1', name: 'Martillo', emoji: '🔨' },
      { id: 'ds-w2', name: 'Llave inglesa', emoji: '🔧' },
      { id: 'ds-w3', name: 'Paraguas', emoji: '☂️' },
      { id: 'ds-w4', name: 'Balón de fútbol', emoji: '⚽' },
      { id: 'ds-w5', name: 'Zapato', emoji: '👞' },
      { id: 'ds-w6', name: 'Linterna', emoji: '🔦' },
    ],
  },
  {
    title: 'Fiesta de cumpleaños',
    emoji: '🎂',
    correctItems: [
      { id: 'fc-1', name: 'Tarta con velas', emoji: '🎂' },
      { id: 'fc-2', name: 'Regalo envuelto', emoji: '🎁' },
      { id: 'fc-3', name: 'Globo de fiesta', emoji: '🎈' },
      { id: 'fc-4', name: 'Música y baile', emoji: '🎵' },
      { id: 'fc-5', name: 'Cámara de fotos', emoji: '📷' },
      { id: 'fc-6', name: 'Dulces y bombones', emoji: '🍬' },
    ],
    wrongItems: [
      { id: 'fc-w1', name: 'Martillo', emoji: '🔨' },
      { id: 'fc-w2', name: 'Sartén', emoji: '🍳' },
      { id: 'fc-w3', name: 'Llave inglesa', emoji: '🔧' },
      { id: 'fc-w4', name: 'Cama de dormir', emoji: '🛏️' },
      { id: 'fc-w5', name: 'Pescado crudo', emoji: '🐟' },
      { id: 'fc-w6', name: 'Candado', emoji: '🔒' },
    ],
  },
  {
    title: 'Cuidar las plantas del jardín',
    emoji: '🌷',
    correctItems: [
      { id: 'jd-1', name: 'Rosa del jardín', emoji: '🌹' },
      { id: 'jd-2', name: 'Tulipanes', emoji: '🌷' },
      { id: 'jd-3', name: 'Girasol', emoji: '🌻' },
      { id: 'jd-4', name: 'Agua de riego', emoji: '💧' },
      { id: 'jd-5', name: 'Tijeras de podar', emoji: '✂️' },
      { id: 'jd-6', name: 'Sombrero de sol', emoji: '👒' },
    ],
    wrongItems: [
      { id: 'jd-w1', name: 'Televisor', emoji: '📺' },
      { id: 'jd-w2', name: 'Sartén', emoji: '🍳' },
      { id: 'jd-w3', name: 'Cama', emoji: '🛏️' },
      { id: 'jd-w4', name: 'Teléfono', emoji: '☎️' },
      { id: 'jd-w5', name: 'Esquís', emoji: '🎿' },
      { id: 'jd-w6', name: 'Reloj de pared', emoji: '⏰' },
    ],
  },
  {
    title: 'Tarde de lectura y escritura',
    emoji: '📚',
    correctItems: [
      { id: 'le-1', name: 'Libro abierto', emoji: '📖' },
      { id: 'le-2', name: 'Cuaderno de notas', emoji: '📓' },
      { id: 'le-3', name: 'Lápiz', emoji: '✏️' },
      { id: 'le-4', name: 'Gafas de vista', emoji: '👓' },
      { id: 'le-5', name: 'Luz de lámpara', emoji: '💡' },
      { id: 'le-6', name: 'Periódico', emoji: '📰' },
    ],
    wrongItems: [
      { id: 'le-w1', name: 'Balón de fútbol', emoji: '⚽' },
      { id: 'le-w2', name: 'Sartén', emoji: '🍳' },
      { id: 'le-w3', name: 'Esquís', emoji: '🎿' },
      { id: 'le-w4', name: 'Pescado', emoji: '🐟' },
      { id: 'le-w5', name: 'Bañador', emoji: '👙' },
      { id: 'le-w6', name: 'Martillo', emoji: '🔨' },
    ],
  },
  {
    title: 'Preparar una ensalada fresca',
    emoji: '🍅',
    correctItems: [
      { id: 'en-1', name: 'Tomates rojos', emoji: '🍅' },
      { id: 'en-2', name: 'Pepino fresco', emoji: '🥒' },
      { id: 'en-3', name: 'Zanahoria', emoji: '🥕' },
      { id: 'en-4', name: 'Aguacate', emoji: '🥑' },
      { id: 'en-5', name: 'Maíz dulce', emoji: '🌽' },
      { id: 'en-6', name: 'Limón para aliñar', emoji: '🍋' },
    ],
    wrongItems: [
      { id: 'en-w1', name: 'Zapato', emoji: '👞' },
      { id: 'en-w2', name: 'Paraguas', emoji: '☂️' },
      { id: 'en-w3', name: 'Martillo', emoji: '🔨' },
      { id: 'en-w4', name: 'Guitarra', emoji: '🎸' },
      { id: 'en-w5', name: 'Reloj', emoji: '⏰' },
      { id: 'en-w6', name: 'Bombilla', emoji: '💡' },
    ],
  },
  {
    title: 'Salir de viaje en tren',
    emoji: '🚆',
    correctItems: [
      { id: 'vt-1', name: 'Maleta de viaje', emoji: '🧳' },
      { id: 'vt-2', name: 'Billete de tren', emoji: '🎫' },
      { id: 'vt-3', name: 'Cámara de fotos', emoji: '📷' },
      { id: 'vt-4', name: 'Libro de lectura', emoji: '📖' },
      { id: 'vt-5', name: 'Reloj de pulsera', emoji: '⌚' },
      { id: 'vt-6', name: 'Bocadillo', emoji: '🥪' },
    ],
    wrongItems: [
      { id: 'vt-w1', name: 'Cama grande', emoji: '🛏️' },
      { id: 'vt-w2', name: 'Sartén', emoji: '🍳' },
      { id: 'vt-w3', name: 'Bañera', emoji: '🛁' },
      { id: 'vt-w4', name: 'Televisor', emoji: '📺' },
      { id: 'vt-w5', name: 'Martillo', emoji: '🔨' },
      { id: 'vt-w6', name: 'Olla de cocina', emoji: '🍲' },
    ],
  },
]

const ROUND_CONFIGS = [
  { needed: 2, total: 4 },
  { needed: 3, total: 6 },
  { needed: 4, total: 8 },
  { needed: 5, total: 10 },
]

export function PackSuitcase({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [sessionScenarios, setSessionScenarios] = useState<Scenario[]>([])
  const [boardItems, setBoardItems] = useState<(PackItem & { isCorrect: boolean })[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const initSession = () => {
    const shuffled = [...SCENARIOS].sort(() => 0.5 - Math.random()).slice(0, 4)
    setSessionScenarios(shuffled)
    setRoundIdx(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    initSession()
    return () => speech.stop()
  }, [])

  useEffect(() => {
    if (sessionScenarios.length === 0) return
    const sc = sessionScenarios[roundIdx] || sessionScenarios[0]
    const cfg = ROUND_CONFIGS[roundIdx] || ROUND_CONFIGS[0]

    const goods = [...sc.correctItems]
      .sort(() => 0.5 - Math.random())
      .slice(0, cfg.needed)
      .map((x) => ({ ...x, isCorrect: true }))
    const bads = [...sc.wrongItems]
      .sort(() => 0.5 - Math.random())
      .slice(0, cfg.total - cfg.needed)
      .map((x) => ({ ...x, isCorrect: false }))

    setBoardItems([...goods, ...bads].sort(() => 0.5 - Math.random()))
    setSelectedIds([])
    setFeedback('')
    isAdvancingRef.current = false

    const timer = setTimeout(() => {
      const voiceFn = pickRandom(INTRO_VOICES)
      speech.speak(voiceFn(sc.title, cfg.needed))
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, sessionScenarios])

  if (sessionScenarios.length === 0) return null
  const currentScenario = sessionScenarios[roundIdx] || sessionScenarios[0]
  const currentCfg = ROUND_CONFIGS[roundIdx] || ROUND_CONFIGS[0]

  const handleToggleItem = (item: PackItem & { isCorrect: boolean }) => {
    if (isAdvancingRef.current || selectedIds.includes(item.id)) return
    sound.playTap()

    if (item.isCorrect) {
      sound.playSuccess()
      const next = [...selectedIds, item.id]
      setSelectedIds(next)
      setFeedback(`¡Bien! ${item.name} guardado (${next.length}/${currentCfg.needed}).`)

      if (next.length === currentCfg.needed) {
        isAdvancingRef.current = true
        const praise = pickRandom(GENERAL_PRAISES)
        setFeedback(praise)

        let hasAdv = false
        const advance = () => {
          if (hasAdv) return
          hasAdv = true
          setTimeout(() => {
            if (roundIdx + 1 < ROUND_CONFIGS.length) {
              setRoundIdx((r) => r + 1)
            } else {
              setIsSuccess(true)
              onComplete()
            }
          }, 500)
        }

        const dur = speech.estimateDurationMs(praise)
        speech.speak(praise, advance)
        setTimeout(advance, dur + 2200)
      } else {
        speech.speak(`¡Muy bien! ${item.name}.`)
      }
    } else {
      sound.playGentleRetry()
      setFeedback(`${item.name} no hace falta para ${currentScenario.title.toLowerCase()}.`)
      speech.speak(`No necesitamos ${item.name} para esto. Prueba con otro dibujo.`)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-orange-400 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-5xl sm:text-7xl leading-none shrink-0">
              {currentScenario.emoji}
            </span>
            <div className="text-left min-w-0">
              <h3 className="text-2xl sm:text-4xl font-black text-stone-950 leading-none">
                {currentScenario.title}
              </h3>
              <p className="text-lg sm:text-2xl font-black text-orange-800 mt-0.5">
                Elige {currentCfg.needed} cosas ({selectedIds.length} de {currentCfg.needed})
              </p>
            </div>
          </div>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-orange-100 border-2 sm:border-3 border-orange-400 text-orange-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            {roundIdx + 1}/4
          </span>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-base sm:text-2xl shrink-0">
            {feedback}
          </div>
        )}

        {/* Items Grid */}
        <div
          className={`flex-1 min-h-0 w-full grid grid-cols-2 gap-2 sm:gap-3 items-stretch ${
            currentCfg.total === 4
              ? 'grid-rows-2'
              : currentCfg.total === 6
              ? 'grid-rows-3'
              : currentCfg.total === 8
              ? 'grid-rows-4'
              : 'grid-rows-5'
          }`}
        >
          {boardItems.map((item) => {
            const isPicked = selectedIds.includes(item.id)
            return (
              <button
                key={item.id}
                disabled={isPicked}
                onClick={() => handleToggleItem(item)}
                className={`relative w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 px-2 sm:px-4 py-1 flex flex-row items-center justify-start sm:justify-center gap-2.5 sm:gap-4 cursor-pointer transition-all active:scale-95 overflow-hidden ${
                  isPicked
                    ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-300'
                    : 'bg-stone-50 hover:bg-orange-50 border-stone-300 hover:border-orange-400 shadow-xs'
                }`}
              >
                {isPicked && (
                  <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white rounded-full p-1">
                    <Check className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
                  </div>
                )}
                <span
                  className={`${
                    currentCfg.total <= 6 ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-6xl'
                  } leading-none shrink-0`}
                >
                  {item.emoji}
                </span>
                <span className="font-black text-stone-950 text-xl sm:text-3xl md:text-4xl text-left leading-tight">
                  {item.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Maleta lista!"
          message="Has preparado todo lo necesario para las 4 ocasiones sin olvidar ningún detalle."
          onRestart={initSession}
          onHome={onExit}
        />
      )}
    </div>
  )
}
