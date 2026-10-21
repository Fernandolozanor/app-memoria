import { useState, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SpeakerButton } from '../components/SpeakerButton'
import { SuccessCelebration } from '../components/SuccessCelebration'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface ItemToPlace {
  name: string
  icon: string
}

// Everyday items often misplaced at home
const ITEMS_POOL: ItemToPlace[] = [
  { name: 'las gafas', icon: '👓' },
  { name: 'las llaves', icon: '🗝️' },
  { name: 'el monedero', icon: '👛' },
  { name: 'el reloj', icon: '⏰' },
  { name: 'el libro', icon: '📖' },
  { name: 'la taza de café', icon: '☕' },
  { name: 'el teléfono', icon: '📱' },
  { name: 'el paraguas', icon: '☂️' },
  { name: 'la libreta', icon: '📓' },
  { name: 'la cartera', icon: '💼' },
  { name: 'el anillo', icon: '💍' },
  { name: 'el pastillero', icon: '💊' },
]

// 3 progressive rounds: exactly 3, 4, and 5 cards flip randomly among the 9 cards
const ROUND_CONFIGS = [
  { flippedCount: 3, label: '3 de 9 tarjetas' },
  { flippedCount: 4, label: '4 de 9 tarjetas' },
  { flippedCount: 5, label: '5 de 9 tarjetas' },
]

// Unbiased Fisher-Yates array shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function getSessionItems(): ItemToPlace[] {
  return shuffle(ITEMS_POOL).slice(0, 3)
}

export function WhereWasIt({ onComplete, onExit }: Props) {
  const [round, setRound] = useState(0) // 0 (3 flipped), 1 (4 flipped), 2 (5 flipped)
  const [sessionItems, setSessionItems] = useState<ItemToPlace[]>(getSessionItems)
  const [phase, setPhase] = useState<'intro' | 'showing' | 'guessing'>('intro')
  const [revealOrder, setRevealOrder] = useState<number[]>([]) // random sequential order of appearance
  const [visibleRevealedSlots, setVisibleRevealedSlots] = useState<number[]>([]) // currently revealed slots in showing
  const [targetSlot, setTargetSlot] = useState(0) // which card holds the item
  const [revealedSlots, setRevealedSlots] = useState<number[]>([]) // cards user has clicked in guessing
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const timerRef = useRef<number | null>(null)
  const staggerTimerRef = useRef<number | null>(null)
  const isAdvancingRef = useRef(false)

  const currentConfig = ROUND_CONFIGS[round] || ROUND_CONFIGS[0]
  const currentItem = sessionItems[round] || sessionItems[0]

  const startRound = (rIdx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (staggerTimerRef.current) clearTimeout(staggerTimerRef.current)

    const count = ROUND_CONFIGS[rIdx].flippedCount

    // 1. Completely randomized position: Fisher-Yates shuffle of all 9 slot indices [0..8]
    const allSlots = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8])
    const chosenSlots = allSlots.slice(0, count)

    // 2. Completely randomized order of appearance for the reveal animation
    const appearanceOrder = shuffle(chosenSlots)

    // 3. Completely randomized placement of the target item inside the chosen flipped slots
    const target = chosenSlots[Math.floor(Math.random() * chosenSlots.length)]

    setRevealOrder(appearanceOrder)
    setVisibleRevealedSlots([])
    setTargetSlot(target)
    setRevealedSlots([])
    setPhase('intro')
    setFeedback('')
    setIsSuccess(false)
    isAdvancingRef.current = false

    const item = sessionItems[rIdx] || sessionItems[0]
    const timer = setTimeout(() => {
      speech.speak(
        `Fíjate bien. En esta mesa hay 9 tarjetas. Voltearemos ${count} y en una esconderemos ${item.name}. Pulsa el botón cuando estés listo.`
      )
    }, 250)

    return () => clearTimeout(timer)
  }

  const initGame = () => {
    const fresh = getSessionItems()
    setSessionItems(fresh)
    setRound(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    const cleanup = startRound(round)
    return () => {
      cleanup()
      if (timerRef.current) clearTimeout(timerRef.current)
      if (staggerTimerRef.current) clearTimeout(staggerTimerRef.current)
      speech.stop()
    }
  }, [round, sessionItems])

  // Triggered when user taps "¡Estoy listo! Ver dónde está →" or "Volver a ver"
  const handleShowCards = () => {
    if (isAdvancingRef.current) return
    sound.playTap()
    setPhase('showing')
    setVisibleRevealedSlots([])

    // Sequential reveal in randomized order of appearance (staggered animation)
    revealOrder.forEach((slotIdx, i) => {
      window.setTimeout(() => {
        sound.playTap()
        setVisibleRevealedSlots((prev) => (prev.includes(slotIdx) ? prev : [...prev, slotIdx]))
      }, (i + 1) * 120)
    })

    const totalStaggerTime = (revealOrder.length + 1) * 120

    staggerTimerRef.current = window.setTimeout(() => {
      let hasShown = false
      const transitionToGuessing = () => {
        if (hasShown) return
        hasShown = true
        // Keep flipped cards visible: reduced to half (1.0s)
        timerRef.current = window.setTimeout(() => {
          setPhase('guessing')
          speech.speak(`¿Dónde estaban ${currentItem.name}? Toca la tarjeta.`)
        }, 1000)
      }

      speech.speak(`Aquí están ${currentItem.name}. Recuerda bien su posición.`, transitionToGuessing)
      timerRef.current = window.setTimeout(transitionToGuessing, 4000)
    }, totalStaggerTime)
  }

  const handleSlotClick = (slotIdx: number) => {
    if (phase !== 'guessing' || isAdvancingRef.current) return
    sound.playTap()

    if (!revealedSlots.includes(slotIdx)) {
      setRevealedSlots((prev) => [...prev, slotIdx])
    }

    if (slotIdx === targetSlot) {
      isAdvancingRef.current = true
      sound.playSuccess()
      const praise = `¡Exacto! Ahí estaban ${currentItem.name}.`
      setFeedback(praise)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (round + 1 < ROUND_CONFIGS.length) {
            setRound((prev) => prev + 1)
          } else {
            setIsSuccess(true)
            onComplete()
          }
        }, 500)
      }

      speech.speak(praise, advance)
      setTimeout(advance, 6000)
    } else {
      sound.playGentleRetry()
      setFeedback('Ahí no estaban. Toca otra tarjeta.')
      speech.speak('Ahí no estaban. Toca otra tarjeta.')
    }
  }

  const titleText =
    phase === 'intro'
      ? 'Fíjate bien'
      : phase === 'showing'
      ? `¡Aquí están ${currentItem.name}!`
      : `¿Dónde estaban?`

  const subtitleText =
    phase === 'intro'
      ? `De las 9 tarjetas de la mesa, voltearemos ${currentConfig.flippedCount} para esconder ${currentItem.name}. Pulsa el botón:`
      : phase === 'showing'
      ? `¡Memoriza en cuál de las ${currentConfig.flippedCount} tarjetas volteadas están!`
      : `Toca la tarjeta donde estaban ${currentItem.name}:`

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl sm:max-w-3xl mx-auto overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-4 border-2 sm:border-3 border-yellow-300 mb-1.5 sm:mb-4 shadow-xs shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <span className="font-black text-stone-900 text-sm sm:text-2xl">Ronda:</span>
          <span className="px-2 sm:px-4 py-1 sm:py-2 bg-yellow-100 text-yellow-950 font-black rounded-xl sm:rounded-2xl text-xs sm:text-2xl whitespace-nowrap">
            {round + 1} de 3 ({currentConfig.flippedCount} de 9 volteadas)
          </span>
        </div>

        <SpeakerButton
          text={
            phase === 'intro'
              ? `Fíjate bien. Hay 9 tarjetas en la mesa. Voltearemos ${currentConfig.flippedCount} para esconder ${currentItem.name}. Pulsa el botón cuando estés listo.`
              : phase === 'guessing'
              ? `¿Dónde estaban ${currentItem.name}? Toca la tarjeta entre las 9 de la mesa.`
              : `Mira dónde dejamos ${currentItem.name}.`
          }
          label="Escuchar"
          className="shrink-0"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-yellow-400 rounded-2xl sm:rounded-3xl p-2 sm:p-6 shadow-md text-center min-h-0 overflow-hidden">
        <div className="shrink-0">
          <h3 className="text-lg sm:text-3xl font-black text-stone-950 mb-0.5 sm:mb-2">
            {titleText}
          </h3>
          <p className="text-xs sm:text-xl font-bold text-stone-700">
            {subtitleText}
          </p>
        </div>

        {feedback && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-sm sm:text-2xl mb-1 sm:mb-3 animate-in fade-in shrink-0">
            {feedback}
          </div>
        )}

        {/* ALWAYS 9 cards in a 3x3 grid */}
        <div className="p-2 sm:p-4 bg-stone-100 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-stone-300 my-auto shadow-inner flex-1 min-h-0 flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-xs sm:max-w-md mx-auto items-center justify-center">
            {Array.from({ length: 9 }).map((_, slotIdx) => {
              const isFlippedInShowing = phase === 'showing' && visibleRevealedSlots.includes(slotIdx)
              const isTargetItem = slotIdx === targetSlot
              const isUserClicked = phase === 'guessing' && revealedSlots.includes(slotIdx)

              // Determine whether this card shows face-up content
              const isShowingFace = isFlippedInShowing || isUserClicked

              return (
                <button
                  key={slotIdx}
                  disabled={phase !== 'guessing'}
                  onClick={() => handleSlotClick(slotIdx)}
                  className={`w-full aspect-square max-h-[82px] sm:max-h-[125px] rounded-xl sm:rounded-2xl border-2 sm:border-4 flex flex-col items-center justify-center p-1 sm:p-2 transition-all select-none ${
                    phase === 'guessing' ? 'cursor-pointer active:scale-95' : 'cursor-default'
                  } ${
                    isShowingFace
                      ? isTargetItem
                        ? 'bg-amber-100 border-amber-500 ring-4 ring-amber-300 shadow-md scale-105'
                        : 'bg-white border-stone-300 shadow-inner'
                      : 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 shadow-xs sm:shadow-md hover:brightness-105'
                  }`}
                  aria-label={`Tarjeta ${slotIdx + 1}`}
                >
                  {isShowingFace ? (
                    isTargetItem ? (
                      <span className="text-3xl sm:text-5xl animate-in zoom-in-75 duration-200">
                        {currentItem.icon}
                      </span>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-lg sm:rounded-xl">
                        <span className="text-stone-400 font-bold text-xs sm:text-sm">
                          Vacía
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-white font-black text-2xl sm:text-5xl">?</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="shrink-0 mt-2 sm:mt-4">
          {phase === 'intro' && (
            <button
              onClick={handleShowCards}
              className="w-full py-3 sm:py-5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl sm:rounded-3xl font-black text-base sm:text-2xl shadow-md border-2 sm:border-3 border-emerald-700 transition-all active:scale-95 cursor-pointer min-h-[48px] sm:min-h-[72px]"
            >
              ¡Estoy listo! Ver dónde están →
            </button>
          )}

          {phase === 'guessing' && (
            <div className="flex justify-center">
              <button
                onClick={handleShowCards}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs sm:text-base rounded-xl sm:rounded-2xl border-2 border-amber-300 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800" />
                <span>¿No lo recuerdas? Volver a mirar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has recordado dónde estaban los objetos superando las rondas de 3, 4 y 5 tarjetas volteadas entre las 9 de la mesa."
          onRestart={initGame}
          onHome={onExit}
        />
      )}
    </div>
  )
}
