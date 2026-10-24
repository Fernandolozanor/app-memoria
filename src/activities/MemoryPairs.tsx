import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, MEMORY_PAIRS_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface MemoryCard {
  id: number
  itemKey: string
  name: string
  icon: string
  color: string
}

const ITEMS = [
  { itemKey: 'reloj', name: 'Reloj', icon: '⏰', color: 'bg-amber-100' },
  { itemKey: 'radio', name: 'Radio', icon: '📻', color: 'bg-blue-100' },
  { itemKey: 'sombrero', name: 'Sombrero', icon: '👒', color: 'bg-purple-100' },
  { itemKey: 'taza', name: 'Café', icon: '☕', color: 'bg-orange-100' },
  { itemKey: 'flor', name: 'Flor', icon: '🌸', color: 'bg-rose-100' },
  { itemKey: 'paraguas', name: 'Paraguas', icon: '☂️', color: 'bg-cyan-100' },
  { itemKey: 'gafas', name: 'Gafas', icon: '👓', color: 'bg-sky-100' },
  { itemKey: 'llave', name: 'Llave', icon: '🔑', color: 'bg-yellow-100' },
  { itemKey: 'libro', name: 'Libro', icon: '📖', color: 'bg-emerald-100' },
  { itemKey: 'guitarra', name: 'Guitarra', icon: '🎸', color: 'bg-amber-100' },
  { itemKey: 'campana', name: 'Campana', icon: '🔔', color: 'bg-yellow-100' },
  { itemKey: 'telefono', name: 'Teléfono', icon: '☎️', color: 'bg-rose-100' },
  { itemKey: 'vela', name: 'Vela', icon: '🕯️', color: 'bg-orange-100' },
  { itemKey: 'tijeras', name: 'Tijeras', icon: '✂️', color: 'bg-teal-100' },
  { itemKey: 'carta', name: 'Carta', icon: '✉️', color: 'bg-blue-100' },
  { itemKey: 'regalo', name: 'Regalo', icon: '🎁', color: 'bg-pink-100' },
  { itemKey: 'zapato', name: 'Zapato', icon: '👞', color: 'bg-stone-200' },
  { itemKey: 'corona', name: 'Corona', icon: '👑', color: 'bg-amber-100' },
  { itemKey: 'sol', name: 'Sol', icon: '☀️', color: 'bg-yellow-100' },
  { itemKey: 'luna', name: 'Luna', icon: '🌙', color: 'bg-indigo-100' },
  { itemKey: 'estrella', name: 'Estrella', icon: '⭐', color: 'bg-amber-100' },
  { itemKey: 'arbol', name: 'Árbol', icon: '🌳', color: 'bg-emerald-100' },
  { itemKey: 'perro', name: 'Perro', icon: '🐶', color: 'bg-orange-100' },
  { itemKey: 'gato', name: 'Gato', icon: '🐱', color: 'bg-amber-100' },
  { itemKey: 'pajaro', name: 'Pájaro', icon: '🐦', color: 'bg-sky-100' },
  { itemKey: 'mariposa', name: 'Mariposa', icon: '🦋', color: 'bg-cyan-100' },
  { itemKey: 'tortuga', name: 'Tortuga', icon: '🐢', color: 'bg-lime-100' },
  { itemKey: 'caballo', name: 'Caballo', icon: '🐴', color: 'bg-amber-100' },
  { itemKey: 'manzana', name: 'Manzana', icon: '🍎', color: 'bg-rose-100' },
  { itemKey: 'naranja', name: 'Naranja', icon: '🍊', color: 'bg-orange-100' },
  { itemKey: 'limon', name: 'Limón', icon: '🍋', color: 'bg-yellow-100' },
  { itemKey: 'fresa', name: 'Fresa', icon: '🍓', color: 'bg-pink-100' },
  { itemKey: 'uvas', name: 'Uvas', icon: '🍇', color: 'bg-purple-100' },
  { itemKey: 'sandia', name: 'Sandía', icon: '🍉', color: 'bg-emerald-100' },
  { itemKey: 'pan', name: 'Pan', icon: '🥖', color: 'bg-amber-100' },
  { itemKey: 'queso', name: 'Queso', icon: '🧀', color: 'bg-yellow-100' },
  { itemKey: 'helado', name: 'Helado', icon: '🍦', color: 'bg-pink-100' },
  { itemKey: 'pastel', name: 'Pastel', icon: '🍰', color: 'bg-rose-100' },
  { itemKey: 'coche', name: 'Coche', icon: '🚗', color: 'bg-red-100' },
  { itemKey: 'barco', name: 'Barco', icon: '⛵', color: 'bg-sky-100' },
  { itemKey: 'avion', name: 'Avión', icon: '✈️', color: 'bg-blue-100' },
  { itemKey: 'tren', name: 'Tren', icon: '🚂', color: 'bg-emerald-100' },
  { itemKey: 'bicicleta', name: 'Bici', icon: '🚲', color: 'bg-teal-100' },
  { itemKey: 'casa', name: 'Casa', icon: '🏠', color: 'bg-orange-100' },
]

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function MemoryPairs({ onComplete, onExit }: Props) {
  const [level, setLevel] = useState<3 | 4>(3) // 3 pairs default
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedKeys, setMatchedKeys] = useState<string[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const recentKeysRef = useRef<string[]>([])

  const setupGame = (pairsCount: 3 | 4 = level) => {
    const available = ITEMS.filter((item) => !recentKeysRef.current.includes(item.itemKey))
    const pool = available.length >= pairsCount ? available : ITEMS
    const selectedItems = shuffle(pool).slice(0, pairsCount)

    // Keep track of the last 16 used objects so rounds are always fresh and varied
    recentKeysRef.current = [
      ...selectedItems.map((i) => i.itemKey),
      ...recentKeysRef.current,
    ].slice(0, 16)

    const deck: MemoryCard[] = []
    let idCounter = 1
    selectedItems.forEach((item) => {
      deck.push({ id: idCounter++, ...item })
      deck.push({ id: idCounter++, ...item })
    })

    const shuffledDeck = shuffle(deck)

    setCards(shuffledDeck)
    setFlippedIndices([])
    setMatchedKeys([])
    setIsLocked(false)
    setIsSuccess(false)

    const introVoice = pickRandom(MEMORY_PAIRS_VOICES.intro)
    speech.speak(introVoice)
  }

  useEffect(() => {
    setupGame(level)
  }, [level])

  const handleCardClick = (index: number) => {
    if (isLocked) return
    if (flippedIndices.includes(index)) return
    if (matchedKeys.includes(cards[index].itemKey)) return

    sound.playTap()
    const newFlipped = [...flippedIndices, index]
    setFlippedIndices(newFlipped)

    if (newFlipped.length === 2) {
      setIsLocked(true)
      const firstCard = cards[newFlipped[0]]
      const secondCard = cards[newFlipped[1]]

      if (firstCard.itemKey === secondCard.itemKey) {
        setTimeout(() => {
          sound.playSuccess()
          const newMatched = [...matchedKeys, firstCard.itemKey]
          setMatchedKeys(newMatched)
          setFlippedIndices([])
          setIsLocked(false)

          const isComplete = newMatched.length === cards.length / 2
          const praise = isComplete
            ? pickRandom(MEMORY_PAIRS_VOICES.allCompleted)
            : pickRandom(MEMORY_PAIRS_VOICES.pairFound)(firstCard.name)

          if (isComplete) {
            let hasAdv = false
            const advance = () => {
              if (hasAdv) return
              hasAdv = true
              setTimeout(() => {
                setIsSuccess(true)
                onComplete()
              }, 500)
            }
            const praiseDuration = speech.estimateDurationMs(praise)
            speech.speak(praise, advance)
            setTimeout(advance, praiseDuration + 2500)
          } else {
            speech.speak(praise)
          }
        }, 500)
      } else {
        setTimeout(() => {
          sound.playGentleRetry()
          setFlippedIndices([])
          setIsLocked(false)
        }, 1300)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl sm:max-w-3xl mx-auto overflow-hidden h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-center gap-2 bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 sm:border-3 border-rose-300 mb-1.5 sm:mb-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Nivel:</span>
          <button
            onClick={() => setLevel(3)}
            className={`px-3.5 sm:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl transition-all cursor-pointer ${
              level === 3
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
            }`}
          >
            3 parejas
          </button>
          <button
            onClick={() => setLevel(4)}
            className={`px-3.5 sm:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl transition-all cursor-pointer ${
              level === 4
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
            }`}
          >
            4 parejas
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-stone-300 rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 shadow-md min-h-0 overflow-hidden gap-2 sm:gap-3">
        <div className="text-center shrink-0">
          <h3 className="font-black text-xl sm:text-3xl text-stone-950">
            Encuentra las parejas
          </h3>
          <p className="text-stone-700 text-sm sm:text-xl font-bold mt-0.5">
            {matchedKeys.length} de {cards.length / 2} parejas encontradas
          </p>
        </div>

        {/* Wide 2-column grid with 3 or 4 rows filling the entire screen */}
        <div
          className={`grid grid-cols-2 gap-2.5 sm:gap-4 w-full flex-1 min-h-0 ${
            level === 3 ? 'grid-rows-3' : 'grid-rows-4'
          }`}
        >
          {cards.map((card, idx) => {
            const isFlipped = flippedIndices.includes(idx) || matchedKeys.includes(card.itemKey)
            const isMatched = matchedKeys.includes(card.itemKey)

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={isMatched || isLocked}
                className={`w-full h-full rounded-2xl sm:rounded-3xl border-2 sm:border-4 transition-all duration-200 flex items-center justify-center p-2 sm:p-4 cursor-pointer select-none min-h-0 overflow-hidden ${
                  isFlipped
                    ? isMatched
                      ? 'bg-emerald-100 border-emerald-500 ring-2 sm:ring-4 ring-emerald-300 scale-[0.98] shadow-xs'
                      : `${card.color} border-rose-400 shadow-sm scale-100`
                    : 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-300 hover:brightness-105 active:scale-95 shadow-sm'
                }`}
                aria-label={isFlipped ? card.name : `Carta ${idx + 1}`}
              >
                {isFlipped ? (
                  <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 animate-in zoom-in-75 duration-200 w-full h-full overflow-hidden px-1">
                    <span className="text-4xl sm:text-7xl leading-none shrink-0">{card.icon}</span>
                    <span className="font-black text-stone-950 text-base sm:text-2xl text-center leading-tight w-full truncate">
                      {card.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-white font-black text-5xl sm:text-7xl">?</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has encontrado todas las parejas con gran memoria."
          onRestart={() => setupGame(level)}
          onHome={onExit}
          mistakeTolerance={3}
        />
      )}
    </div>
  )
}
