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

interface HomeItem {
  id: string
  name: string
  emoji: string
}

interface RoomPlace {
  title: string
  emoji: string
  correctItems: HomeItem[]
  wrongItems: HomeItem[]
}

const INTRO_VOICES = [
  (t: string, n: number) => `${t}. Toca las ${n} cosas que se guardan aquí.`,
  (t: string, n: number) => `Vamos a ordenar: ${t}. Elige los ${n} objetos que van en este sitio.`,
  (t: string, n: number) => `¿Qué guardamos en ${t.toLowerCase()}? Señala ${n} dibujos.`,
]

// 10 lugares cotidianos de la casa con 6-7 objetos correctos y 6-7 incorrectos cada uno
const PLACES: RoomPlace[] = [
  {
    title: 'La Nevera de la cocina',
    emoji: '❄️',
    correctItems: [
      { id: 'nv-1', name: 'Botella de leche', emoji: '🥛' },
      { id: 'nv-2', name: 'Queso fresco', emoji: '🧀' },
      { id: 'nv-3', name: 'Huevos', emoji: '🥚' },
      { id: 'nv-4', name: 'Pescado fresco', emoji: '🐟' },
      { id: 'nv-5', name: 'Pollo', emoji: '🍗' },
      { id: 'nv-6', name: 'Sandía cortada', emoji: '🍉' },
      { id: 'nv-7', name: 'Tarta fría', emoji: '🍰' },
    ],
    wrongItems: [
      { id: 'nv-w1', name: 'Camisa', emoji: '👔' },
      { id: 'nv-w2', name: 'Martillo', emoji: '🔨' },
      { id: 'nv-w3', name: 'Zapatos', emoji: '👞' },
      { id: 'nv-w4', name: 'Libro', emoji: '📚' },
      { id: 'nv-w5', name: 'Reloj', emoji: '⏰' },
      { id: 'nv-w6', name: 'Paraguas', emoji: '☂️' },
    ],
  },
  {
    title: 'El Armario de la ropa',
    emoji: '🚪',
    correctItems: [
      { id: 'ar-1', name: 'Camisa limpia', emoji: '👔' },
      { id: 'ar-2', name: 'Vestido', emoji: '👗' },
      { id: 'ar-3', name: 'Pantalones', emoji: '👖' },
      { id: 'ar-4', name: 'Camiseta', emoji: '👕' },
      { id: 'ar-5', name: 'Zapatos', emoji: '👞' },
      { id: 'ar-6', name: 'Botas altas', emoji: '👢' },
      { id: 'ar-7', name: 'Sombrero', emoji: '🎩' },
    ],
    wrongItems: [
      { id: 'ar-w1', name: 'Sartén', emoji: '🍳' },
      { id: 'ar-w2', name: 'Sandía', emoji: '🍉' },
      { id: 'ar-w3', name: 'Llave inglesa', emoji: '🔧' },
      { id: 'ar-w4', name: 'Plátano', emoji: '🍌' },
      { id: 'ar-w5', name: 'Tomates', emoji: '🍅' },
      { id: 'ar-w6', name: 'Pescado', emoji: '🐟' },
    ],
  },
  {
    title: 'El Maletín de herramientas',
    emoji: '🔨',
    correctItems: [
      { id: 'mh-1', name: 'Martillo', emoji: '🔨' },
      { id: 'mh-2', name: 'Llave inglesa', emoji: '🔧' },
      { id: 'mh-3', name: 'Tornillo y tuerca', emoji: '🔩' },
      { id: 'mh-4', name: 'Linterna', emoji: '🔦' },
      { id: 'mh-5', name: 'Candado', emoji: '🔒' },
      { id: 'mh-6', name: 'Regla de medir', emoji: '📏' },
    ],
    wrongItems: [
      { id: 'mh-w1', name: 'Cruasán', emoji: '🥐' },
      { id: 'mh-w2', name: 'Trozo de tarta', emoji: '🍰' },
      { id: 'mh-w3', name: 'Manzana', emoji: '🍎' },
      { id: 'mh-w4', name: 'Sombrero', emoji: '🎩' },
      { id: 'mh-w5', name: 'Helado', emoji: '🍦' },
      { id: 'mh-w6', name: 'Uvas', emoji: '🍇' },
    ],
  },
  {
    title: 'El Escritorio de estudio',
    emoji: '📚',
    correctItems: [
      { id: 'es-1', name: 'Libros', emoji: '📚' },
      { id: 'es-2', name: 'Lápiz', emoji: '✏️' },
      { id: 'es-3', name: 'Cuaderno', emoji: '📓' },
      { id: 'es-4', name: 'Tijeras', emoji: '✂️' },
      { id: 'es-5', name: 'Regla', emoji: '📏' },
      { id: 'es-6', name: 'Gafas de lectura', emoji: '👓' },
    ],
    wrongItems: [
      { id: 'es-w1', name: 'Pescado', emoji: '🐟' },
      { id: 'es-w2', name: 'Balón', emoji: '⚽' },
      { id: 'es-w3', name: 'Olla de comida', emoji: '🍲' },
      { id: 'es-w4', name: 'Paraguas', emoji: '☂️' },
      { id: 'es-w5', name: 'Sandía', emoji: '🍉' },
      { id: 'es-w6', name: 'Pollo asado', emoji: '🍗' },
    ],
  },
  {
    title: 'El Frutero de la mesa',
    emoji: '🍎',
    correctItems: [
      { id: 'fr-1', name: 'Manzanas rojas', emoji: '🍎' },
      { id: 'fr-2', name: 'Plátanos', emoji: '🍌' },
      { id: 'fr-3', name: 'Naranjas', emoji: '🍊' },
      { id: 'fr-4', name: 'Peras', emoji: '🍐' },
      { id: 'fr-5', name: 'Racimo de uvas', emoji: '🍇' },
      { id: 'fr-6', name: 'Limones', emoji: '🍋' },
      { id: 'fr-7', name: 'Melocotón', emoji: '🍑' },
    ],
    wrongItems: [
      { id: 'fr-w1', name: 'Zapato', emoji: '👞' },
      { id: 'fr-w2', name: 'Tijeras', emoji: '✂️' },
      { id: 'fr-w3', name: 'Reloj', emoji: '⏰' },
      { id: 'fr-w4', name: 'Bombilla', emoji: '💡' },
      { id: 'fr-w5', name: 'Martillo', emoji: '🔨' },
      { id: 'fr-w6', name: 'Llave', emoji: '🔑' },
    ],
  },
  {
    title: 'El Mueble de la vajilla',
    emoji: '🍽️',
    correctItems: [
      { id: 'vj-1', name: 'Platos y cubiertos', emoji: '🍽️' },
      { id: 'vj-2', name: 'Taza de café', emoji: '☕' },
      { id: 'vj-3', name: 'Copa de cristal', emoji: '🍷' },
      { id: 'vj-4', name: 'Cuchillo de mesa', emoji: '🔪' },
      { id: 'vj-5', name: 'Olla de cocina', emoji: '🍲' },
      { id: 'vj-6', name: 'Sartén', emoji: '🍳' },
    ],
    wrongItems: [
      { id: 'vj-w1', name: 'Pantalones', emoji: '👖' },
      { id: 'vj-w2', name: 'Bicicleta', emoji: '🚲' },
      { id: 'vj-w3', name: 'Zapatos', emoji: '👞' },
      { id: 'vj-w4', name: 'Balón de fútbol', emoji: '⚽' },
      { id: 'vj-w5', name: 'Guitarra', emoji: '🎸' },
      { id: 'vj-w6', name: 'Martillo', emoji: '🔨' },
    ],
  },
  {
    title: 'El Joyero y tocador',
    emoji: '💍',
    correctItems: [
      { id: 'jy-1', name: 'Anillo brillante', emoji: '💍' },
      { id: 'jy-2', name: 'Reloj de pulsera', emoji: '⌚' },
      { id: 'jy-3', name: 'Gafas', emoji: '👓' },
      { id: 'jy-4', name: 'Diadema o corona', emoji: '👑' },
      { id: 'jy-5', name: 'Piedra preciosa', emoji: '💎' },
      { id: 'jy-6', name: 'Barra de labios', emoji: '💄' },
    ],
    wrongItems: [
      { id: 'jy-w1', name: 'Patatas', emoji: '🥔' },
      { id: 'jy-w2', name: 'Sartén', emoji: '🍳' },
      { id: 'jy-w3', name: 'Pescado', emoji: '🐟' },
      { id: 'jy-w4', name: 'Pan de barra', emoji: '🥖' },
      { id: 'jy-w5', name: 'Balón', emoji: '⚽' },
      { id: 'jy-w6', name: 'Llave inglesa', emoji: '🔧' },
    ],
  },
  {
    title: 'El Rincón de la música',
    emoji: '🎵',
    correctItems: [
      { id: 'ms-1', name: 'Guitarra española', emoji: '🎸' },
      { id: 'ms-2', name: 'Trompeta', emoji: '🎺' },
      { id: 'ms-3', name: 'Violín', emoji: '🎻' },
      { id: 'ms-4', name: 'Teclado de piano', emoji: '🎹' },
      { id: 'ms-5', name: 'Campana sonora', emoji: '🔔' },
      { id: 'ms-6', name: 'Micrófono', emoji: '🎤' },
    ],
    wrongItems: [
      { id: 'ms-w1', name: 'Zanahoria', emoji: '🥕' },
      { id: 'ms-w2', name: 'Sartén', emoji: '🍳' },
      { id: 'ms-w3', name: 'Botas', emoji: '👢' },
      { id: 'ms-w4', name: 'Pescado', emoji: '🐟' },
      { id: 'ms-w5', name: 'Huevos', emoji: '🥚' },
      { id: 'ms-w6', name: 'Martillo', emoji: '🔨' },
    ],
  },
]

const ROUND_STEPS = [
  { needed: 2, total: 4 },
  { needed: 3, total: 6 },
  { needed: 4, total: 8 },
  { needed: 5, total: 10 },
]

export function TidyHome({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [sessionPlaces, setSessionPlaces] = useState<RoomPlace[]>([])
  const [boardItems, setBoardItems] = useState<(HomeItem & { isCorrect: boolean })[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const initSession = () => {
    const shuffled = [...PLACES].sort(() => 0.5 - Math.random()).slice(0, 4)
    setSessionPlaces(shuffled)
    setRoundIdx(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    initSession()
    return () => speech.stop()
  }, [])

  useEffect(() => {
    if (sessionPlaces.length === 0) return
    const place = sessionPlaces[roundIdx] || sessionPlaces[0]
    const cfg = ROUND_STEPS[roundIdx] || ROUND_STEPS[0]

    const goods = [...place.correctItems]
      .sort(() => 0.5 - Math.random())
      .slice(0, cfg.needed)
      .map((x) => ({ ...x, isCorrect: true }))
    const bads = [...place.wrongItems]
      .sort(() => 0.5 - Math.random())
      .slice(0, cfg.total - cfg.needed)
      .map((x) => ({ ...x, isCorrect: false }))

    setBoardItems([...goods, ...bads].sort(() => 0.5 - Math.random()))
    setSelectedIds([])
    setFeedback('')
    isAdvancingRef.current = false

    const timer = setTimeout(() => {
      const voiceFn = pickRandom(INTRO_VOICES)
      speech.speak(voiceFn(place.title, cfg.needed))
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, sessionPlaces])

  if (sessionPlaces.length === 0) return null
  const currentPlace = sessionPlaces[roundIdx] || sessionPlaces[0]
  const currentCfg = ROUND_STEPS[roundIdx] || ROUND_STEPS[0]

  const handleSelectItem = (item: HomeItem & { isCorrect: boolean }) => {
    if (isAdvancingRef.current || selectedIds.includes(item.id)) return
    sound.playTap()

    if (item.isCorrect) {
      sound.playSuccess()
      const next = [...selectedIds, item.id]
      setSelectedIds(next)
      setFeedback(`¡Muy bien! ${item.name} guardado (${next.length}/${currentCfg.needed}).`)

      if (next.length === currentCfg.needed) {
        isAdvancingRef.current = true
        const praise = pickRandom(GENERAL_PRAISES)
        setFeedback(praise)

        let hasAdv = false
        const advance = () => {
          if (hasAdv) return
          hasAdv = true
          setTimeout(() => {
            if (roundIdx + 1 < ROUND_STEPS.length) {
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
        speech.speak(`¡Bien! ${item.name}.`)
      }
    } else {
      sound.playGentleRetry()
      setFeedback(`${item.name} no se guarda en ${currentPlace.title.toLowerCase()}.`)
      speech.speak(`Eso no se guarda en ${currentPlace.title.toLowerCase()}. Prueba con otro objeto.`)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-cyan-400 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-5xl sm:text-7xl leading-none shrink-0">{currentPlace.emoji}</span>
            <div className="text-left min-w-0">
              <h3 className="text-2xl sm:text-4xl font-black text-stone-950 leading-none">
                {currentPlace.title}
              </h3>
              <p className="text-lg sm:text-2xl font-black text-cyan-800 mt-0.5">
                Guarda {currentCfg.needed} cosas ({selectedIds.length} de {currentCfg.needed})
              </p>
            </div>
          </div>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-cyan-100 border-2 sm:border-3 border-cyan-400 text-cyan-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            {roundIdx + 1}/4
          </span>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-base sm:text-2xl shrink-0">
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
                onClick={() => handleSelectItem(item)}
                className={`relative w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 px-2 sm:px-4 py-1 flex flex-row items-center justify-start sm:justify-center gap-2.5 sm:gap-4 cursor-pointer transition-all active:scale-95 overflow-hidden ${
                  isPicked
                    ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-300'
                    : 'bg-stone-50 hover:bg-cyan-50 border-stone-300 hover:border-cyan-400 shadow-xs'
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
          title="¡Casa en orden!"
          message="Has guardado cada objeto en su lugar correspondiente con total acierto."
          onRestart={initSession}
          onHome={onExit}
        />
      )}
    </div>
  )
}
