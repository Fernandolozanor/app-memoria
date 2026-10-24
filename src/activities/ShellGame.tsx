import { useState, useEffect, useRef } from 'react'
import { Eye } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_PRAISES, GENERAL_RETRIES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface RoundConfig {
  cupCount: number
  ballCount: number
  swaps: number
  swapMs: number
  label: string
}

const ROUNDS: RoundConfig[] = [
  { cupCount: 3, ballCount: 1, swaps: 3, swapMs: 850, label: '3 vasos · Movimiento suave' },
  { cupCount: 3, ballCount: 1, swaps: 5, swapMs: 650, label: '3 vasos · Más rápido' },
  { cupCount: 4, ballCount: 1, swaps: 6, swapMs: 580, label: '4 vasos · 1 bolita' },
  { cupCount: 4, ballCount: 2, swaps: 6, swapMs: 580, label: '4 vasos · 2 bolitas' },
]

const INTRO_PHRASES_SINGLE = [
  'Mira bien debajo de qué vaso está la bolita roja. Cuando estés listo, pulsa el botón verde para mezclar.',
  'Fíjate en el vaso levantado con la bolita. Pulsa el botón verde para taparla y mover los vasos.',
  'Abre bien los ojos: ahí tienes la bolita roja. Dale al botón verde cuando quieras que empiecen a cruzarse.',
  'No pierdas de vista el vaso que guarda la bolita. Toca el botón verde para empezar a mezclar.',
  'Atención a la mesa: memoriza dónde está la bolita y pulsa el botón para mover los cubiletes.',
]

const INTRO_PHRASES_DOUBLE = [
  '¡Gran reto final! Ahora hay 2 bolitas escondidas. Fíjate bien en los dos vasos y pulsa el botón para mezclar.',
  'Última ronda con 2 bolitas rojas. Mira bien en qué dos vasos están y dale al botón verde.',
  'Doble atención: tenemos 2 bolitas en la mesa. Grábate sus dos vasos y pulsa el botón para moverlos.',
]

const SHUFFLE_BANNERS = [
  '¡Sigue el vaso con la vista!',
  '¡Atención a cómo se cruzan los vasos!',
  '¡No le quites el ojo de encima!',
  '¡Mira bien por dónde va el cubilete!',
]

const GUESS_PROMPTS_SINGLE = [
  '¿Dónde ha quedado la bolita? Toca su vaso.',
  '¿En qué vaso está escondida la bolita ahora? Tócalo.',
  'A ver esa vista de lince: ¿debajo de qué vaso está la bolita?',
  'Se han parado los vasos. ¿Dónde está la bolita roja?',
]

const GUESS_PROMPTS_DOUBLE = [
  '¿Dónde están las 2 bolitas? Toca los dos vasos.',
  'Señala los dos vasos que guardan las bolitas rojas.',
  'A ver qué tal: toca los 2 vasos donde han quedado las bolitas.',
]

const FIRST_BALL_PRAISES = [
  '¡Muy bien, encontraste la primera! ¿Dónde está la otra bolita?',
  '¡Ahí estaba una! Ahora toca el vaso de la segunda bolita.',
  '¡Bravo, ya tienes una bolita! Busca en qué vaso está la otra.',
]

type Phase = 'ready' | 'shuffling' | 'guessing' | 'round-won'

export function ShellGame({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [cupSlots, setCupSlots] = useState<number[]>([0, 1, 2])
  const [winningCups, setWinningCups] = useState<number[]>([1])
  const [liftedCups, setLiftedCups] = useState<number[]>([1])
  const [foundCups, setFoundCups] = useState<number[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const timersRef = useRef<number[]>([])
  const isAdvancingRef = useRef(false)

  const config = ROUNDS[roundIdx] || ROUNDS[0]

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }

  const initRound = (rIdx: number) => {
    clearTimers()
    isAdvancingRef.current = false
    const cfg = ROUNDS[rIdx] || ROUNDS[0]
    const initialSlots = Array.from({ length: cfg.cupCount }, (_, i) => i)

    const shuffledIds = [...initialSlots].sort(() => 0.5 - Math.random())
    const winners = shuffledIds.slice(0, cfg.ballCount)

    setCupSlots(initialSlots)
    setWinningCups(winners)
    setLiftedCups(winners)
    setFoundCups([])
    setFeedback('')
    setPhase('ready')

    const t = window.setTimeout(() => {
      const msg =
        cfg.ballCount === 1
          ? pickRandom(INTRO_PHRASES_SINGLE)
          : pickRandom(INTRO_PHRASES_DOUBLE)
      speech.speak(`Ronda ${rIdx + 1}. ${msg}`)
    }, 250)
    timersRef.current.push(t)
  }

  useEffect(() => {
    initRound(roundIdx)
    return () => {
      clearTimers()
      speech.stop()
    }
  }, [roundIdx])

  const handleStartShuffle = () => {
    if (phase !== 'ready') return
    sound.playTap()
    speech.stop()
    setFeedback(pickRandom(SHUFFLE_BANNERS))
    setLiftedCups([])
    setPhase('shuffling')

    const cfg = ROUNDS[roundIdx] || ROUNDS[0]
    let currentSlots = [...cupSlots]
    let lastPairKey = ''

    for (let step = 0; step < cfg.swaps; step++) {
      const t = window.setTimeout(() => {
        sound.playTap()
        const allCups = Array.from({ length: cfg.cupCount }, (_, i) => i)
        let cupA = 0
        let cupB = 1
        for (let attempt = 0; attempt < 12; attempt++) {
          const picked = [...allCups].sort(() => 0.5 - Math.random())
          cupA = picked[0]
          cupB = picked[1]
          const key = [Math.min(cupA, cupB), Math.max(cupA, cupB)].join('-')
          if (key !== lastPairKey) {
            lastPairKey = key
            break
          }
        }

        const nextSlots = [...currentSlots]
        const temp = nextSlots[cupA]
        nextSlots[cupA] = nextSlots[cupB]
        nextSlots[cupB] = temp
        currentSlots = nextSlots
        setCupSlots(nextSlots)
      }, 650 + step * cfg.swapMs)

      timersRef.current.push(t)
    }

    const endTime = 650 + cfg.swaps * cfg.swapMs + 250
    const endTimer = window.setTimeout(() => {
      setPhase('guessing')
      const prompt =
        cfg.ballCount === 1
          ? pickRandom(GUESS_PROMPTS_SINGLE)
          : pickRandom(GUESS_PROMPTS_DOUBLE)
      setFeedback(prompt)
      speech.speak(prompt)
    }, endTime)
    timersRef.current.push(endTimer)
  }

  const handleSelectCup = (cupId: number) => {
    if (phase !== 'guessing' || isAdvancingRef.current) return
    if (liftedCups.includes(cupId)) return

    sound.playTap()
    setLiftedCups((prev) => [...prev, cupId])

    const isWinner = winningCups.includes(cupId)
    if (isWinner) {
      sound.playSuccess()
      const nextFound = [...foundCups, cupId]
      setFoundCups(nextFound)

      if (nextFound.length === config.ballCount) {
        isAdvancingRef.current = true
        setPhase('round-won')
        const praise = pickRandom(GENERAL_PRAISES)
        setFeedback(praise)

        let hasAdvanced = false
        const advance = () => {
          if (hasAdvanced) return
          hasAdvanced = true
          setTimeout(() => {
            if (roundIdx + 1 < ROUNDS.length) {
              setRoundIdx((r) => r + 1)
            } else {
              setIsSuccess(true)
              onComplete()
            }
          }, 500)
        }

        const dur = speech.estimateDurationMs(praise)
        speech.speak(praise, advance)
        const ft = window.setTimeout(advance, dur + 2200)
        timersRef.current.push(ft)
      } else {
        const halfMsg = pickRandom(FIRST_BALL_PRAISES)
        setFeedback(halfMsg)
        speech.speak(halfMsg)
      }
    } else {
      sound.playGentleRetry()
      const retry = pickRandom(GENERAL_RETRIES)
      setFeedback('En ese vaso no estaba. Prueba con otro.')
      speech.speak(retry)
      const lowerTimer = window.setTimeout(() => {
        setLiftedCups((prev) => prev.filter((id) => id !== cupId))
      }, 1000)
      timersRef.current.push(lowerTimer)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-red-400 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-4xl sm:text-6xl leading-none">🥤</span>
            <div className="text-left">
              <h3 className="text-2xl sm:text-4xl font-black text-stone-950 leading-none">
                ¿Dónde está la bolita?
              </h3>
              <p className="text-base sm:text-2xl font-bold text-stone-600 mt-0.5">
                {config.label}
              </p>
            </div>
          </div>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-red-100 border-2 sm:border-3 border-red-400 text-red-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            Ronda {roundIdx + 1}/{ROUNDS.length}
          </span>
        </div>

        {/* Instruction / Feedback Banner */}
        <div className="p-2 sm:p-3.5 rounded-2xl bg-amber-100 border-2 sm:border-3 border-amber-400 text-amber-950 font-black text-xl sm:text-3xl shrink-0">
          {feedback ||
            (config.ballCount === 1
              ? 'Fíjate bien debajo de qué vaso está la bolita roja'
              : 'Fíjate bien dónde están las 2 bolitas rojas')}
        </div>

        {/* Green Felt Table with Animated Cups */}
        <div className="relative flex-1 min-h-0 w-full bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-3xl border-4 sm:border-[6px] border-amber-800 shadow-inner flex items-center overflow-hidden px-2 sm:px-6">
          <div className="relative w-full h-56 sm:h-72 flex items-center">
            {Array.from({ length: config.cupCount }, (_, cupId) => {
              const slotIdx = cupSlots[cupId] ?? cupId
              const isLifted = liftedCups.includes(cupId)
              const hasBall = winningCups.includes(cupId)
              const widthPct = 100 / config.cupCount
              const leftPct = slotIdx * widthPct

              return (
                <div
                  key={cupId}
                  style={{
                    width: `${widthPct}%`,
                    left: `${leftPct}%`,
                    transition: `left ${config.swapMs * 0.88}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  }}
                  className="absolute inset-y-0 flex flex-col items-center justify-end pb-4 sm:pb-6 px-1 sm:px-3"
                >
                  {/* Ball sitting on the table */}
                  {hasBall && (
                    <div
                      className={`absolute bottom-5 sm:bottom-8 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-800 border-4 border-white shadow-xl flex items-center justify-center transition-opacity duration-150 ${
                        isLifted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/70 -translate-x-2 -translate-y-2" />
                    </div>
                  )}

                  {/* The Cup Button */}
                  <button
                    onClick={() => handleSelectCup(cupId)}
                    disabled={phase !== 'guessing'}
                    aria-label={`Vaso ${slotIdx + 1}`}
                    className={`relative z-10 w-full max-w-[140px] sm:max-w-[190px] h-36 sm:h-52 flex flex-col items-center justify-between cursor-pointer select-none transition-transform duration-300 ease-out ${
                      isLifted ? '-translate-y-20 sm:-translate-y-28' : 'translate-y-0'
                    } ${phase === 'guessing' ? 'hover:scale-105 active:scale-95' : ''}`}
                  >
                    <div className="w-[82%] h-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 rounded-t-3xl border-4 sm:border-[5px] border-amber-950 shadow-2xl flex flex-col items-center justify-center">
                      <span className="text-4xl sm:text-6xl font-black text-amber-950 drop-shadow-xs">
                        🥤
                      </span>
                    </div>
                    <div className="w-full h-5 sm:h-7 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-800 rounded-full border-3 sm:border-4 border-amber-950 -mt-1 shadow-md" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Button during Ready Phase */}
        {phase === 'ready' && (
          <button
            onClick={handleStartShuffle}
            className="w-full py-3.5 sm:py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl sm:rounded-3xl font-black text-2xl sm:text-4xl shadow-md border-3 border-emerald-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3 shrink-0 animate-start-pulse"
          >
            <Eye className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
            <span>¡Listo! Tapar y mezclar vasos</span>
          </button>
        )}
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Vista de lince!"
          message="Has seguido la bolita en las 4 rondas sin perderla de vista ni un segundo."
          onRestart={() => {
            setIsSuccess(false)
            setRoundIdx(0)
            initRound(0)
          }}
          onHome={onExit}
        />
      )}
    </div>
  )
}
