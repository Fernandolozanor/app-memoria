import { useState, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, WHERE_WAS_IT_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface ItemToPlace {
  name: string
  icon: string
  isPlural: boolean
}

// Everyday items often placed at home, with grammatical plurality tag
const ITEMS_POOL: ItemToPlace[] = [
  { name: 'las gafas', icon: '👓', isPlural: true },
  { name: 'las llaves', icon: '🗝️', isPlural: true },
  { name: 'el monedero', icon: '👛', isPlural: false },
  { name: 'el reloj', icon: '⏰', isPlural: false },
  { name: 'el libro', icon: '📖', isPlural: false },
  { name: 'la taza de café', icon: '☕', isPlural: false },
  { name: 'el teléfono', icon: '📱', isPlural: false },
  { name: 'el paraguas', icon: '☂️', isPlural: false },
  { name: 'la libreta', icon: '📓', isPlural: false },
  { name: 'la cartera', icon: '💼', isPlural: false },
  { name: 'el anillo', icon: '💍', isPlural: false },
  { name: 'el pastillero', icon: '💊', isPlural: false },
  { name: 'el sombrero', icon: '👒', isPlural: false },
  { name: 'la radio', icon: '📻', isPlural: false },
  { name: 'las tijeras', icon: '✂️', isPlural: true },
  { name: 'la vela', icon: '🕯️', isPlural: false },
  { name: 'la campana', icon: '🔔', isPlural: false },
  { name: 'la guitarra', icon: '🎸', isPlural: false },
  { name: 'el regalo', icon: '🎁', isPlural: false },
  { name: 'la carta', icon: '✉️', isPlural: false },
  { name: 'los zapatos', icon: '👞', isPlural: true },
  { name: 'la flor', icon: '🌸', isPlural: false },
  { name: 'la manzana', icon: '🍎', isPlural: false },
  { name: 'el pan', icon: '🥖', isPlural: false },
  { name: 'el queso', icon: '🧀', isPlural: false },
  { name: 'la cámara', icon: '📷', isPlural: false },
  { name: 'la linterna', icon: '🔦', isPlural: false },
  { name: 'el peine', icon: '🪮', isPlural: false },
]

// 3 progressive rounds: 9 (3x3), 12 (3x4), and 16 (4x4) total cards filling the screen
const ROUND_CONFIGS = [
  {
    totalCards: 9,
    flippedCount: 3,
    gridLayout: 'grid-cols-3 grid-rows-3',
    iconSize: 'text-5xl sm:text-7xl',
  },
  {
    totalCards: 12,
    flippedCount: 4,
    gridLayout: 'grid-cols-3 grid-rows-4',
    iconSize: 'text-5xl sm:text-7xl',
  },
  {
    totalCards: 16,
    flippedCount: 5,
    gridLayout: 'grid-cols-4 grid-rows-4',
    iconSize: 'text-4xl sm:text-6xl',
  },
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
  const [round, setRound] = useState(0) // 0 (9 cards), 1 (12 cards), 2 (16 cards)
  const [sessionItems, setSessionItems] = useState<ItemToPlace[]>(getSessionItems)
  const [phase, setPhase] = useState<'intro' | 'showing' | 'guessing'>('intro')
  const [revealOrder, setRevealOrder] = useState<number[]>([]) // sequential order of appearance
  const [visibleRevealedSlots, setVisibleRevealedSlots] = useState<number[]>([]) // currently face-up slots
  const [targetSlot, setTargetSlot] = useState(0) // which card holds the target item
  const [slotItems, setSlotItems] = useState<Record<number, ItemToPlace>>({}) // random item assigned to each flipped slot
  const [revealedSlots, setRevealedSlots] = useState<number[]>([]) // cards user has clicked in guessing
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const timeoutsRef = useRef<number[]>([])
  const isAdvancingRef = useRef(false)

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id))
    timeoutsRef.current = []
  }

  const addTimeout = (fn: () => void, delayMs: number) => {
    const id = window.setTimeout(fn, delayMs)
    timeoutsRef.current.push(id)
    return id
  }

  const currentConfig = ROUND_CONFIGS[round] || ROUND_CONFIGS[0]
  const currentItem = sessionItems[round] || sessionItems[0]

  // Grammatical concordance helpers
  const estaba = currentItem.isPlural ? 'estaban' : 'estaba'

  const startRound = (rIdx: number) => {
    clearAllTimeouts()

    const config = ROUND_CONFIGS[rIdx] || ROUND_CONFIGS[0]
    const count = config.flippedCount
    const total = config.totalCards
    const targetItem = sessionItems[rIdx] || sessionItems[0]

    // 1. Completely randomized position among all totalCards
    const allSlots = shuffle(Array.from({ length: total }, (_, i) => i))
    const chosenSlots = allSlots.slice(0, count)

    // 2. Completely randomized order of appearance for the reveal animation
    const appearanceOrder = shuffle(chosenSlots)

    // 3. Completely randomized placement of the target item inside the chosen flipped slots
    const target = chosenSlots[Math.floor(Math.random() * chosenSlots.length)]

    // 4. Pick random distinct distractor objects for all the other flipped cards
    const distractors = shuffle(
      ITEMS_POOL.filter((it) => it.name !== targetItem.name)
    ).slice(0, count - 1)

    const map: Record<number, ItemToPlace> = {}
    let distIdx = 0
    chosenSlots.forEach((slotIdx) => {
      if (slotIdx === target) {
        map[slotIdx] = targetItem
      } else {
        map[slotIdx] = distractors[distIdx++]
      }
    })

    setSlotItems(map)
    setRevealOrder(appearanceOrder)
    setVisibleRevealedSlots([])
    setTargetSlot(target)
    setRevealedSlots([])
    setPhase('intro')
    setFeedback('')
    setIsSuccess(false)
    isAdvancingRef.current = false

    addTimeout(() => {
      const introVoice = pickRandom(WHERE_WAS_IT_VOICES.intro)(total, count)
      speech.speak(introVoice)
    }, 250)
  }

  const initGame = () => {
    const fresh = getSessionItems()
    setSessionItems(fresh)
    setRound(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    startRound(round)
    return () => {
      clearAllTimeouts()
      speech.stop()
    }
  }, [round, sessionItems])

  // Triggered when user taps "¡Estoy listo! Ver dónde está/están →" or "Volver a mirar"
  const handleShowCards = () => {
    if (isAdvancingRef.current) return
    clearAllTimeouts()
    speech.stop()
    sound.playTap()

    setPhase('showing')
    setVisibleRevealedSlots([])

    // 1. Sequential reveal in randomized order of appearance
    revealOrder.forEach((slotIdx, i) => {
      addTimeout(() => {
        sound.playTap()
        setVisibleRevealedSlots((prev) => (prev.includes(slotIdx) ? prev : [...prev, slotIdx]))
      }, (i + 1) * 150)
    })

    const totalRevealTime = (revealOrder.length + 1) * 150

    // 2. Once all flipped cards are revealed, start voice locution & adapt reverse hiding to speech duration
    addTimeout(() => {
      const explanationVoice = pickRandom(WHERE_WAS_IT_VOICES.showing)(currentConfig.flippedCount)
      const voiceDuration = speech.estimateDurationMs(explanationVoice)

      let transitioned = false
      const transitionToGuessing = () => {
        if (transitioned) return
        transitioned = true
        setVisibleRevealedSlots([])
        setPhase('guessing')
        const guessingPrompt = pickRandom(WHERE_WAS_IT_VOICES.guessing)(estaba, currentItem.name)
        speech.speak(guessingPrompt)
      }

      // 3. While the locution is being spoken, keep cards open during the first half, then hide in REVERSE order
      const reverseOrder = [...revealOrder].reverse()
      const startHideAt = Math.max(1200, Math.floor(voiceDuration * 0.45))
      const stepHideInterval = Math.max(260, Math.floor((voiceDuration * 0.50) / Math.max(1, reverseOrder.length)))
      const lastHideTime = startHideAt + reverseOrder.length * stepHideInterval

      reverseOrder.forEach((slotIdx, i) => {
        addTimeout(() => {
          sound.playTap()
          setVisibleRevealedSlots((prev) => prev.filter((s) => s !== slotIdx))
        }, startHideAt + i * stepHideInterval)
      })

      let voiceDone = false
      let hideDone = false

      const checkReadyToGuess = () => {
        if (voiceDone && hideDone) {
          transitionToGuessing()
        }
      }

      speech.speak(explanationVoice, () => {
        voiceDone = true
        checkReadyToGuess()
      })

      addTimeout(() => {
        hideDone = true
        checkReadyToGuess()
      }, lastHideTime)

      // Safety fallback adapted to the speech duration
      addTimeout(transitionToGuessing, Math.max(voiceDuration, lastHideTime) + 2200)
    }, totalRevealTime)
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
      const praise = pickRandom(WHERE_WAS_IT_VOICES.correct)(estaba, currentItem.name)
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

      const praiseDuration = speech.estimateDurationMs(praise)
      speech.speak(praise, advance)
      setTimeout(advance, praiseDuration + 2500)
    } else {
      sound.playGentleRetry()
      const clickedItem = slotItems[slotIdx]
      const retryMsg = clickedItem
        ? `Ahí ${clickedItem.isPlural ? 'estaban' : 'estaba'} ${clickedItem.name}. Busca dónde ${estaba} ${currentItem.name}.`
        : pickRandom(WHERE_WAS_IT_VOICES.wrong)(estaba)
      setFeedback(retryMsg)
      speech.speak(retryMsg)
    }
  }

  const titleText =
    phase === 'intro'
      ? 'Fíjate bien'
      : phase === 'showing'
      ? `¡Memoriza los ${currentConfig.flippedCount} objetos!`
      : `¿Dónde ${estaba} ${currentItem.name}? ${currentItem.icon}`

  const subtitleText =
    phase === 'intro'
      ? `De las ${currentConfig.totalCards} tarjetas de la mesa, voltearemos ${currentConfig.flippedCount} con objetos distintos. Pulsa el botón:`
      : phase === 'showing'
      ? `Recuerda qué objeto hay en cada una de las ${currentConfig.flippedCount} tarjetas volteadas:`
      : `Toca la tarjeta donde ${estaba} ${currentItem.name}:`

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl sm:max-w-3xl mx-auto overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center justify-center bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 sm:border-3 border-yellow-300 mb-1.5 sm:mb-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Ronda:</span>
          <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-yellow-100 text-yellow-950 font-black rounded-xl sm:rounded-2xl text-base sm:text-2xl whitespace-nowrap">
            {round + 1} de 3 ({currentConfig.flippedCount} de {currentConfig.totalCards} volteadas)
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-yellow-400 rounded-2xl sm:rounded-3xl p-2 sm:p-6 shadow-md text-center min-h-0 overflow-hidden gap-1.5 sm:gap-3">
        <div className="shrink-0">
          <h3 className="text-xl sm:text-3xl font-black text-stone-950 mb-0.5">
            {titleText}
          </h3>
          <p className="text-sm sm:text-xl font-bold text-stone-700 leading-snug">
            {subtitleText}
          </p>
        </div>

        {feedback && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-base sm:text-2xl animate-in fade-in shrink-0">
            {feedback}
          </div>
        )}

        {/* Full-screen cards grid: 9 (3x3), 12 (3x4), 16 (4x4) */}
        <div className="p-2 sm:p-4 bg-stone-100 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-stone-300 shadow-inner flex-1 min-h-0 flex flex-col">
          <div
            className={`grid ${currentConfig.gridLayout} gap-2 sm:gap-3.5 w-full h-full flex-1 min-h-0`}
          >
            {Array.from({ length: currentConfig.totalCards }).map((_, slotIdx) => {
              const isFlippedInShowing =
                phase === 'showing' && visibleRevealedSlots.includes(slotIdx)
              const isTargetItem = slotIdx === targetSlot
              const isUserClicked = phase === 'guessing' && revealedSlots.includes(slotIdx)
              const slotItem = slotItems[slotIdx]

              // Determine whether this card shows face-up content
              const isShowingFace = isFlippedInShowing || isUserClicked

              return (
                <button
                  key={slotIdx}
                  disabled={phase !== 'guessing'}
                  onClick={() => handleSlotClick(slotIdx)}
                  className={`w-full h-full min-h-0 rounded-xl sm:rounded-2xl border-2 sm:border-4 flex flex-col items-center justify-center p-1 sm:p-2 transition-all select-none overflow-hidden ${
                    phase === 'guessing' ? 'cursor-pointer active:scale-95' : 'cursor-default'
                  } ${
                    isShowingFace
                      ? isUserClicked && isTargetItem
                        ? 'bg-emerald-100 border-emerald-500 ring-4 ring-emerald-300 shadow-md scale-[1.02]'
                        : slotItem
                        ? 'bg-amber-50 border-amber-400 shadow-md'
                        : 'bg-white border-stone-300 shadow-inner'
                      : 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 shadow-xs sm:shadow-md hover:brightness-105'
                  }`}
                  aria-label={`Tarjeta ${slotIdx + 1}`}
                >
                  {isShowingFace ? (
                    slotItem ? (
                      <span className={`${currentConfig.iconSize} leading-none animate-in zoom-in-75 duration-200`}>
                        {slotItem.icon}
                      </span>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-lg sm:rounded-xl">
                        <span className="text-stone-400 font-black text-sm sm:text-xl">
                          Vacía
                        </span>
                      </div>
                    )
                  ) : (
                    <span className={`text-white font-black ${currentConfig.iconSize}`}>?</span>
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
              className="w-full py-3 sm:py-5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl sm:rounded-3xl font-black text-base sm:text-2xl shadow-md border-2 sm:border-3 border-emerald-700 transition-all active:scale-95 cursor-pointer min-h-[48px] sm:min-h-[72px] animate-start-pulse"
            >
              ¡Estoy listo! Ver los objetos →
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
          message="Has recordado la posición de los objetos superando las tres rondas de 9, 12 y 16 tarjetas en la mesa."
          onRestart={initGame}
          onHome={onExit}
        />
      )}
    </div>
  )
}
