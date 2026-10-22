import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, SPOT_OBJECT_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface SpotRound {
  targetIcon: string
  targetName: string
  distractorIcon: string
  distractorName: string
}

// Rich pool of 10 everyday, distinct pairs
const ALL_SPOT_PAIRS: SpotRound[] = [
  {
    targetIcon: '🗝️',
    targetName: 'la llave dorada',
    distractorIcon: '🥄',
    distractorName: 'las cucharas',
  },
  {
    targetIcon: '🐦',
    targetName: 'el pajarito',
    distractorIcon: '🍃',
    distractorName: 'las hojas',
  },
  {
    targetIcon: '🔔',
    targetName: 'la campana',
    distractorIcon: '🔘',
    distractorName: 'los botones',
  },
  {
    targetIcon: '⭐',
    targetName: 'la estrella',
    distractorIcon: '🌙',
    distractorName: 'las lunas',
  },
  {
    targetIcon: '🍎',
    targetName: 'la manzana roja',
    distractorIcon: '🍐',
    distractorName: 'las peras verdes',
  },
  {
    targetIcon: '☀️',
    targetName: 'el sol brillante',
    distractorIcon: '☁️',
    distractorName: 'las nubes',
  },
  {
    targetIcon: '🌸',
    targetName: 'la flor rosa',
    distractorIcon: '☘️',
    distractorName: 'los tréboles',
  },
  {
    targetIcon: '🐟',
    targetName: 'el pez',
    distractorIcon: '⛵',
    distractorName: 'los barquitos',
  },
  {
    targetIcon: '❤️',
    targetName: 'el corazón',
    distractorIcon: '💎',
    distractorName: 'los diamantes',
  },
  {
    targetIcon: '☕',
    targetName: 'la taza de café',
    distractorIcon: '🥛',
    distractorName: 'los vasos de leche',
  },
]

// 3 progressive rounds: 6 cards, 9 cards, 12 cards
const ROUND_CARD_COUNTS = [6, 9, 12]

function getSessionPairs(): SpotRound[] {
  return [...ALL_SPOT_PAIRS].sort(() => 0.5 - Math.random()).slice(0, 3)
}

export function SpotObject({ onComplete, onExit }: Props) {
  const [round, setRound] = useState(0) // 3 progressive rounds: 0 (6 cards), 1 (9 cards), 2 (12 cards)
  const [sessionPairs, setSessionPairs] = useState<SpotRound[]>(getSessionPairs)
  const [targetIndex, setTargetIndex] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'showing' | 'guessing'>('ready')
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const timerRef = useRef<number | null>(null)
  const fallbackRef = useRef<number | null>(null)
  const isAdvancingRef = useRef(false)

  const cardCount = ROUND_CARD_COUNTS[round] || 6

  const revealCards = (roundNum: number) => {
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current)
      fallbackRef.current = null
    }

    setPhase((currentPhase) => {
      if (currentPhase !== 'ready') return currentPhase

      // Viewing duration reduced to half: 1.0s for 6 cards, 1.3s for 9 cards, 1.6s for 12 cards
      const viewDuration = roundNum === 0 ? 1000 : roundNum === 1 ? 1300 : 1600

      timerRef.current = window.setTimeout(() => {
        setPhase('guessing')
        const guessingPhrase = pickRandom(SPOT_OBJECT_VOICES.guessing)
        speech.speak(guessingPhrase)
      }, viewDuration)

      return 'showing'
    })
  }

  const startRound = (roundNum: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (fallbackRef.current) clearTimeout(fallbackRef.current)

    const count = ROUND_CARD_COUNTS[roundNum] || 6
    const randomPos = Math.floor(Math.random() * count)
    setTargetIndex(randomPos)
    setPhase('ready') // Cards start face down
    setRevealedIndex(null)
    setFeedback('')
    setIsSuccess(false)
    isAdvancingRef.current = false

    const introPhrase = pickRandom(SPOT_OBJECT_VOICES.intro)(count)
    const introDuration = speech.estimateDurationMs(introPhrase)

    // Initial 250ms buffer ensuring DOM is mounted
    timerRef.current = window.setTimeout(() => {
      // Step 1: Varied voice intro - wait for full locution before revealing cards
      speech.speak(introPhrase, () => {
        // Step 2: brief pause after voice ends, then show cards
        timerRef.current = window.setTimeout(() => {
          revealCards(roundNum)
        }, 300)
      })

      // Safety fallback timer adapted to the actual duration of the intro locution
      fallbackRef.current = window.setTimeout(() => {
        revealCards(roundNum)
      }, introDuration + 2200)
    }, 250)
  }

  useEffect(() => {
    startRound(round)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (fallbackRef.current) clearTimeout(fallbackRef.current)
      speech.stop()
    }
  }, [round, sessionPairs])

  const handleCardClick = (idx: number) => {
    if (phase !== 'guessing' || isAdvancingRef.current) return
    sound.playTap()
    setRevealedIndex(idx)

    if (idx === targetIndex) {
      isAdvancingRef.current = true
      sound.playSuccess()
      const praise = pickRandom(SPOT_OBJECT_VOICES.correct)
      setFeedback(praise)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (round + 1 < sessionPairs.length) {
            setRound(round + 1)
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
      const retryPhrase = pickRandom(SPOT_OBJECT_VOICES.wrong)
      setFeedback(retryPhrase)
      speech.speak(retryPhrase)
    }
  }

  const handleRestart = () => {
    setSessionPairs(getSessionPairs())
    setRound(0)
    setIsSuccess(false)
  }

  const current = sessionPairs[round] || sessionPairs[0]

  const promptText =
    phase === 'ready'
      ? 'Fíjate bien...'
      : phase === 'showing'
      ? '¡Mira la diferente!'
      : '¿Dónde estaba el objeto diferente?'

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl mx-auto overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center justify-center bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 sm:border-3 border-sky-300 mb-1.5 sm:mb-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Ronda:</span>
          <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-sky-100 text-sky-950 font-black rounded-xl sm:rounded-2xl text-base sm:text-2xl whitespace-nowrap">
            {round + 1} de {sessionPairs.length} ({cardCount} tarjetas)
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-sky-400 rounded-2xl sm:rounded-3xl p-2 sm:p-6 shadow-md text-center min-h-0 overflow-hidden">
        <div className="shrink-0">
          <h3 className="text-xl sm:text-3xl font-black text-sky-950 mb-0.5 sm:mb-2">
            {promptText}
          </h3>
          <p className="text-sm sm:text-xl font-bold text-stone-700">
            {phase === 'ready'
              ? 'Escucha atentamente. Las cartas se mostrarán en un momento...'
              : phase === 'showing'
              ? '¡Memoriza cuál no es igual!'
              : 'Toca la tarjeta donde estaba el objeto diferente:'}
          </p>
        </div>

        {feedback && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-sky-100 border-2 border-sky-300 text-sky-950 font-black text-base sm:text-2xl mb-1 sm:mb-3 animate-in fade-in shrink-0">
            {feedback}
          </div>
        )}

        {/* Progressive cards grid: 6 cards (3x2), 9 cards (3x3), 12 cards (4x3) */}
        <div
          className={`grid ${
            cardCount === 12
              ? 'grid-cols-4 max-w-xl gap-2 sm:gap-3.5'
              : 'grid-cols-3 max-w-lg gap-2.5 sm:gap-4'
          } w-full mx-auto flex-1 min-h-0 my-auto items-center`}
        >
          {Array.from({ length: cardCount }).map((_, idx) => {
            const isTarget = idx === targetIndex
            const icon = isTarget ? current.targetIcon : current.distractorIcon
            // Only show face during 'showing' or when revealed correctly
            const isShowingFace = phase === 'showing' || revealedIndex === idx

            return (
              <button
                key={idx}
                disabled={phase !== 'guessing'}
                onClick={() => handleCardClick(idx)}
                className={`w-full h-full ${
                  cardCount === 12
                    ? 'max-h-[125px] sm:max-h-[175px] min-h-[60px] sm:min-h-[80px] p-1.5 sm:p-2.5'
                    : 'max-h-[145px] sm:max-h-[200px] min-h-[72px] sm:min-h-[95px] p-2 sm:p-3'
                } rounded-2xl sm:rounded-3xl border-3 sm:border-4 flex items-center justify-center transition-all cursor-pointer select-none ${
                  isShowingFace
                    ? isTarget && phase === 'guessing'
                      ? 'bg-emerald-100 border-emerald-500 ring-2 sm:ring-4 ring-emerald-300 scale-105 shadow-md'
                      : 'bg-sky-50 border-sky-300 shadow-sm'
                    : 'bg-gradient-to-br from-sky-500 to-blue-600 border-sky-400 hover:brightness-105 active:scale-95 shadow-sm'
                }`}
                aria-label={`Carta ${idx + 1}`}
              >
                {isShowingFace ? (
                  <span
                    className={`${
                      cardCount === 12 ? 'text-5xl sm:text-7xl' : 'text-6xl sm:text-8xl'
                    } animate-in zoom-in-75 duration-150`}
                  >
                    {icon}
                  </span>
                ) : (
                  <span
                    className={`text-white font-black ${
                      cardCount === 12 ? 'text-4xl sm:text-6xl' : 'text-5xl sm:text-7xl'
                    }`}
                  >
                    ?
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has encontrado todos los objetos diferentes."
          onRestart={handleRestart}
          onHome={onExit}
        />
      )}
    </div>
  )
}
