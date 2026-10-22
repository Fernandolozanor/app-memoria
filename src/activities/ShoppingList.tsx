import { useState, useEffect, useRef } from 'react'
import { Check, ShoppingBag, Eye } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface Product {
  id: string
  name: string
  icon: string
}

// Catalog of 40 universally supported market and grocery products in Spain
const ALL_PRODUCTS: Product[] = [
  { id: 'pan', name: 'Pan', icon: '🥖' },
  { id: 'manzana', name: 'Manzana roja', icon: '🍎' },
  { id: 'manzana-verde', name: 'Manzana verde', icon: '🍏' },
  { id: 'leche', name: 'Leche', icon: '🥛' },
  { id: 'platano', name: 'Plátano', icon: '🍌' },
  { id: 'huevos', name: 'Huevos', icon: '🥚' },
  { id: 'naranja', name: 'Naranja', icon: '🍊' },
  { id: 'queso', name: 'Queso', icon: '🧀' },
  { id: 'pescado', name: 'Pescado', icon: '🐟' },
  { id: 'tomate', name: 'Tomate', icon: '🍅' },
  { id: 'zanahoria', name: 'Zanahoria', icon: '🥕' },
  { id: 'pepino', name: 'Pepino', icon: '🥒' },
  { id: 'berenjena', name: 'Berenjena', icon: '🍆' },
  { id: 'pera', name: 'Pera', icon: '🍐' },
  { id: 'uvas', name: 'Uvas', icon: '🍇' },
  { id: 'fresas', name: 'Fresas', icon: '🍓' },
  { id: 'limon', name: 'Limón', icon: '🍋' },
  { id: 'sandia', name: 'Sandía', icon: '🍉' },
  { id: 'melon', name: 'Melón', icon: '🍈' },
  { id: 'cerezas', name: 'Cerezas', icon: '🍒' },
  { id: 'melocoton', name: 'Melocotón', icon: '🍑' },
  { id: 'pina', name: 'Piña', icon: '🍍' },
  { id: 'patatas', name: 'Patatas', icon: '🥔' },
  { id: 'maiz', name: 'Maíz', icon: '🌽' },
  { id: 'champinones', name: 'Champiñones', icon: '🍄' },
  { id: 'aguacate', name: 'Aguacate', icon: '🥑' },
  { id: 'nueces', name: 'Nueces', icon: '🥜' },
  { id: 'pollo', name: 'Pollo', icon: '🍗' },
  { id: 'jamon', name: 'Jamón', icon: '🥓' },
  { id: 'arroz', name: 'Arroz', icon: '🍚' },
  { id: 'miel', name: 'Miel', icon: '🍯' },
  { id: 'pan-molde', name: 'Pan de molde', icon: '🍞' },
  { id: 'galletas', name: 'Galletas', icon: '🍪' },
  { id: 'cruasan', name: 'Cruasán', icon: '🥐' },
  { id: 'cafe', name: 'Café', icon: '☕' },
  { id: 'chocolate', name: 'Chocolate', icon: '🍫' },
  { id: 'pastel', name: 'Tarta', icon: '🍰' },
  { id: 'helado', name: 'Helado', icon: '🍦' },
  { id: 'caramelo', name: 'Caramelos', icon: '🍬' },
  { id: 'sandwich', name: 'Sándwich', icon: '🥪' },
]

interface RoundConfig {
  targetCount: number // How many items to memorize
  choiceCount: number // How many total items to choose from
}

// 3 sequential rounds: 6 choices, 10 choices, 12 choices
const ROUNDS_CONFIG: RoundConfig[] = [
  { targetCount: 2, choiceCount: 6 },
  { targetCount: 3, choiceCount: 10 },
  { targetCount: 4, choiceCount: 12 },
]

interface RoundTextConfig {
  memorizeSpeech: (names: string) => string
  memorizeSubtitle: string
  memorizeButton: string
  memorizeSpeaker: (names: string) => string
  recallSpeech: string
  recallTitle: string
  recallSpeaker: (choiceCount: number) => string
  roundCompleteSpeech: string
}

// Varied and natural phrases tailored to each round
const ROUND_TEXTS: RoundTextConfig[] = [
  {
    memorizeSpeech: (names) =>
      `Vamos a preparar la cesta. Fíjate bien en estos 2 productos: ${names}. Cuando te los aprendas, pulsa el botón verde.`,
    memorizeSubtitle: 'Míralos con calma y pulsa el botón cuando los tengas en mente',
    memorizeButton: '¡Me los sé! Ir a la tienda →',
    memorizeSpeaker: (names) =>
      `Fíjate en estos 2 productos: ${names}. Pulsa el botón cuando te los aprendas.`,
    recallSpeech: 'Encuentra en el mostrador los 2 productos que apuntamos en la lista.',
    recallTitle: '¿Recuerdas los 2 alimentos de la lista?',
    recallSpeaker: (choiceCount) =>
      `Toca los 2 alimentos de la lista entre los ${choiceCount} que hay en el mostrador.`,
    roundCompleteSpeech:
      '¡Estupendo! Has completado la primera lista sin problemas. ¡Vamos a por la siguiente!',
  },
  {
    memorizeSpeech: (names) =>
      `Muy bien. Ahora la lista tiene 3 cosas: ${names}. Tómate tu tiempo para memorizarlos y pulsa el botón verde.`,
    memorizeSubtitle: 'Concéntrate en estos 3 alimentos y avísame cuando estés listo',
    memorizeButton: '¡Listo! Buscar en las estanterías →',
    memorizeSpeaker: (names) =>
      `Esta vez son 3 productos: ${names}. Pulsa el botón cuando estés listo.`,
    recallSpeech: 'A ver qué buena memoria tienes. Señala los 3 alimentos de la cesta.',
    recallTitle: '¿Cuáles eran los 3 productos de esta lista?',
    recallSpeaker: (choiceCount) =>
      `Señala los 3 alimentos de la lista entre los ${choiceCount} productos expuestos.`,
    roundCompleteSpeech:
      '¡Magnífico! Ya tienes los tres productos. Ahora viene la ronda final.',
  },
  {
    memorizeSpeech: (names) =>
      `¡Última ronda! Esta lista es más completa, son 4 alimentos: ${names}. Míralos con atención y pulsa el botón cuando los recuerdes.`,
    memorizeSubtitle: 'El gran reto final: grábate estos 4 alimentos en la memoria',
    memorizeButton: '¡Los tengo! A por la compra →',
    memorizeSpeaker: (names) =>
      `Última lista con 4 productos: ${names}. Pulsa el botón cuando los tengas.`,
    recallSpeech: 'Aquí hay más variedad. Elige los 4 alimentos que teníamos que comprar.',
    recallTitle: '¿Dónde están los 4 alimentos que memorizaste?',
    recallSpeaker: (choiceCount) =>
      `Busca y toca los 4 alimentos de la lista entre los ${choiceCount} del mostrador.`,
    roundCompleteSpeech:
      '¡Enhorabuena! Has hecho una compra perfecta y tu memoria ha funcionado de maravilla.',
  },
]

// Varied feedback when hitting an item (before completing the whole round)
const HIT_PRAISES = [
  (name: string) => `¡Eso es! Has metido ${name} en la cesta.`,
  (name: string) => `¡Estupendo! Teníamos apuntado ${name}.`,
  (name: string) => `¡Perfecto! Justo estaba en la lista: ${name}.`,
  (name: string) => `¡Muy bien visto! ${name} ya está en la bolsa.`,
]

// Rotating gentle audio feedback on mistake
const RETRY_VOICES = [
  'Ese no lo teníamos apuntado hoy. Prueba con otro.',
  'Ese alimento no estaba en la lista. Mira con calma.',
  'Vaya, hoy no necesitamos ese producto. Sigue buscando.',
  'Ese no venía en la cesta. Tómate tu tiempo y elige otro.',
]

// Rotating gentle visual feedback on mistake
const RETRY_MESSAGES = [
  (name: string) => `"${name}" no estaba en la lista de hoy. Busca con calma.`,
  (name: string) => `"${name}" se queda en la tienda. ¡Prueba con otro!`,
  (name: string) => `"${name}" no lo habíamos apuntado. Tómate tu tiempo.`,
]

export function ShoppingList({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0) // 0 (6 choices), 1 (10 choices), 2 (12 choices)
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize')
  const [targetItems, setTargetItems] = useState<Product[]>([])
  const [displayItems, setDisplayItems] = useState<Product[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hintMessage, setHintMessage] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)

  const isAdvancingRef = useRef(false)
  const retryCountRef = useRef(0)
  const hitCountRef = useRef(0)

  const currentConfig = ROUNDS_CONFIG[roundIdx] || ROUNDS_CONFIG[0]
  const currentTexts = ROUND_TEXTS[roundIdx] || ROUND_TEXTS[0]

  // Setup round whenever roundIdx changes
  useEffect(() => {
    isAdvancingRef.current = false
    setSelectedIds([])
    setHintMessage('')
    setPhase('memorize')
    setIsSuccess(false)

    // Select random targets and distractors from the catalog
    const shuffledCatalog = [...ALL_PRODUCTS].sort(() => 0.5 - Math.random())
    const targets = shuffledCatalog.slice(0, currentConfig.targetCount)
    const distractorPool = shuffledCatalog.filter((p) => !targets.some((t) => t.id === p.id))
    const distractors = distractorPool.slice(0, currentConfig.choiceCount - currentConfig.targetCount)

    // Shuffle the combined items for the market counter
    const combined = [...targets, ...distractors].sort(() => 0.5 - Math.random())

    setTargetItems(targets)
    setDisplayItems(combined)

    const names = targets.map((t) => t.name).join(', ')
    const timer = setTimeout(() => {
      speech.speak(currentTexts.memorizeSpeech(names))
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx])

  const handleFinishMemorizing = () => {
    if (isAdvancingRef.current) return
    sound.playTap()
    setPhase('recall')
    speech.speak(currentTexts.recallSpeech)
  }

  const handleSelectProduct = (product: Product) => {
    if (isAdvancingRef.current) return
    sound.playTap()

    const isTarget = targetItems.some((t) => t.id === product.id)

    if (isTarget) {
      if (!selectedIds.includes(product.id)) {
        sound.playSuccess()
        const newSelected = [...selectedIds, product.id]
        setSelectedIds(newSelected)

        const praiseFn = HIT_PRAISES[hitCountRef.current % HIT_PRAISES.length]
        hitCountRef.current += 1
        setHintMessage(praiseFn(product.name))

        // Check if all targets for this round were found
        if (newSelected.length === targetItems.length) {
          isAdvancingRef.current = true

          let hasAdv = false
          const advance = () => {
            if (hasAdv) return
            hasAdv = true
            setTimeout(() => {
              if (roundIdx + 1 < ROUNDS_CONFIG.length) {
                setRoundIdx((prev) => prev + 1)
              } else {
                setIsSuccess(true)
                onComplete()
              }
            }, 500)
          }

          const completeDuration = speech.estimateDurationMs(currentTexts.roundCompleteSpeech)
          speech.speak(currentTexts.roundCompleteSpeech, advance)
          setTimeout(advance, completeDuration + 2500)
        } else {
          // Speak a brief warm confirmation for this item
          speech.speak(`¡Muy bien, ${product.name}!`)
        }
      }
    } else {
      sound.playGentleRetry()
      const msgFn = RETRY_MESSAGES[retryCountRef.current % RETRY_MESSAGES.length]
      const voiceText = RETRY_VOICES[retryCountRef.current % RETRY_VOICES.length]
      retryCountRef.current += 1

      setHintMessage(msgFn(product.name))
      speech.speak(voiceText)
    }
  }

  const handleRestart = () => {
    setRoundIdx(0)
    setIsSuccess(false)
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-3xl mx-auto overflow-hidden h-full">
      {/* Top Bar with round progress */}
      <div className="flex items-center justify-center gap-2 bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 sm:border-3 border-amber-300 mb-1.5 sm:mb-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Ronda:</span>
          <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-amber-100 text-amber-950 font-black rounded-xl sm:rounded-2xl text-base sm:text-2xl">
            {roundIdx + 1} de 3 ({currentConfig.choiceCount} productos)
          </span>
        </div>
      </div>

      {phase === 'memorize' && (
        <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-amber-400 rounded-2xl sm:rounded-3xl p-3 sm:p-7 text-center shadow-md min-h-0 overflow-hidden">
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 text-amber-950 font-black text-xl sm:text-3xl mb-1 sm:mb-2">
              <Eye className="w-6 h-6 sm:w-10 sm:h-10 text-amber-600 stroke-[2.5]" />
              <span>Recuerda estos {targetItems.length} alimentos:</span>
            </div>

            <p className="text-sm sm:text-xl font-bold text-stone-600">
              {currentTexts.memorizeSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 my-auto shrink-0">
            {targetItems.map((item) => (
              <div
                key={item.id}
                className="bg-amber-50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 sm:border-3 border-amber-300 shadow-sm flex flex-col items-center w-36 sm:w-52"
              >
                <span className="text-6xl sm:text-8xl mb-1.5 sm:mb-2" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="font-black text-stone-950 text-base sm:text-3xl text-center leading-tight">
                  {item.name}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleFinishMemorizing}
            className="w-full py-3 sm:py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-3xl shadow-md border-2 sm:border-3 border-emerald-700 transition-all active:scale-95 cursor-pointer min-h-[52px] sm:min-h-[72px] shrink-0 mt-auto"
          >
            {currentTexts.memorizeButton}
          </button>
        </div>
      )}

      {phase === 'recall' && (
        <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-stone-300 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 sm:w-8 sm:h-8 text-amber-600 stroke-[2.5]" />
              <h3 className="font-black text-base sm:text-2xl text-stone-950">
                {currentTexts.recallTitle}
              </h3>
            </div>
            <span className="font-black text-sm sm:text-lg text-emerald-950 bg-emerald-100 px-2.5 sm:px-3 py-1 rounded-xl border border-emerald-400">
              {selectedIds.length} de {targetItems.length}
            </span>
          </div>

          {hintMessage && (
            <div className="text-sm sm:text-xl font-black text-stone-900 bg-amber-100 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-amber-300 text-center shrink-0">
              {hintMessage}
            </div>
          )}

          {/* Dynamic grid responding to choice count: 6, 10, or 12 items */}
          <div
            className={`flex-1 min-h-0 my-auto grid gap-1.5 sm:gap-3 ${
              currentConfig.choiceCount === 6
                ? 'grid-cols-3'
                : currentConfig.choiceCount === 10
                ? 'grid-cols-5'
                : 'grid-cols-4 sm:grid-cols-6'
            }`}
          >
            {displayItems.map((item) => {
              const isFound = selectedIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  disabled={isFound}
                  onClick={() => handleSelectProduct(item)}
                  className={`relative p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 sm:border-3 flex flex-col items-center justify-center transition-all cursor-pointer h-full min-h-[60px] sm:min-h-[110px] ${
                    isFound
                      ? 'bg-emerald-100 border-emerald-500 opacity-90 cursor-default ring-2 ring-emerald-300 scale-95'
                      : 'bg-stone-50 hover:bg-amber-50 border-stone-300 hover:border-amber-400 shadow-xs active:scale-95'
                  }`}
                  aria-label={`${item.name} ${isFound ? '(ya encontrado)' : ''}`}
                >
                  {isFound && (
                    <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 sm:p-1 shadow-xs">
                      <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[3]" />
                    </div>
                  )}
                  <span
                    className={`${
                      currentConfig.choiceCount >= 10 ? 'text-3xl sm:text-6xl' : 'text-5xl sm:text-7xl'
                    } mb-1`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`font-black text-stone-950 ${
                      currentConfig.choiceCount === 6 ? 'text-sm sm:text-2xl' : 'text-xs sm:text-xl'
                    } text-center leading-tight break-words w-full px-0.5`}
                  >
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isSuccess && (
        <SuccessCelebration
          title="¡Compra completada!"
          message="Has superado las 3 listas de la compra recordando todos los productos entre 6, 10 y 12 artículos del mercado."
          onRestart={handleRestart}
          onHome={onExit}
        />
      )}
    </div>
  )
}
