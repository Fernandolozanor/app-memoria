import { useState, useEffect, useRef } from 'react'
import { Eye, HelpCircle } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SpeakerButton } from '../components/SpeakerButton'
import { SuccessCelebration } from '../components/SuccessCelebration'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface Person {
  id: string
  name: string
  gender: 'M' | 'F'
  avatar: string
  hobby: string
  hobbyEmoji: string
}

// Clean avatar helper: strips any stray gender symbols (♂ \u2642, ♀ \u2640), variation selectors, or ZWJ
export function cleanAvatar(avatar: string): string {
  return avatar.replace(/[\u2640\u2642\uFE0F\u200D]/g, '').trim()
}

// Unbiased Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Rich, diverse database representing all ages (seniors, adults, youth) and ethnicities/races
const PEOPLE_DATABASE: Person[] = [
  // Older adults & seniors (diverse skin tones & backgrounds)
  {
    id: 'carmen',
    name: 'Carmen',
    gender: 'F',
    avatar: '👵',
    hobby: 'Le gustan las flores',
    hobbyEmoji: '🌸',
  },
  {
    id: 'manuel',
    name: 'Manuel',
    gender: 'M',
    avatar: '👴',
    hobby: 'Lee el periódico cada día',
    hobbyEmoji: '📰',
  },
  {
    id: 'teresa',
    name: 'Teresa',
    gender: 'F',
    avatar: '👵🏼',
    hobby: 'Hace ricas galletas caseras',
    hobbyEmoji: '🍪',
  },
  {
    id: 'francisco',
    name: 'Francisco',
    gender: 'M',
    avatar: '👴🏻',
    hobby: 'Cuida su huerto de tomates',
    hobbyEmoji: '🍅',
  },
  {
    id: 'pilar',
    name: 'Pilar',
    gender: 'F',
    avatar: '👵🏽',
    hobby: 'Le encanta tejer con lana',
    hobbyEmoji: '🧶',
  },
  {
    id: 'jose',
    name: 'José',
    gender: 'M',
    avatar: '👴🏼',
    hobby: 'Juega al dominó en el club',
    hobbyEmoji: '🎲',
  },
  {
    id: 'dolores',
    name: 'Dolores',
    gender: 'F',
    avatar: '👵🏾',
    hobby: 'Pasea por el parque con amigas',
    hobbyEmoji: '🌳',
  },
  {
    id: 'rafael',
    name: 'Rafael',
    gender: 'M',
    avatar: '👴🏽',
    hobby: 'Canta en el coro del barrio',
    hobbyEmoji: '🎵',
  },
  {
    id: 'aicha',
    name: 'Aïcha',
    gender: 'F',
    avatar: '👵🏿',
    hobby: 'Teje cestas de mimbre artesanas',
    hobbyEmoji: '🧺',
  },
  {
    id: 'mamadou',
    name: 'Mamadou',
    gender: 'M',
    avatar: '👴🏿',
    hobby: 'Camina cada mañana al amanecer',
    hobbyEmoji: '🌅',
  },
  {
    id: 'mercedes',
    name: 'Mercedes',
    gender: 'F',
    avatar: '🧓',
    hobby: 'Prepara chocolate caliente con churros',
    hobbyEmoji: '☕',
  },
  {
    id: 'antonio-mayor',
    name: 'Antonio',
    gender: 'M',
    avatar: '🧓🏼',
    hobby: 'Toca la guitarra española',
    hobbyEmoji: '🎸',
  },

  // Middle-aged adults (diverse ethnicities & styles)
  {
    id: 'pedro',
    name: 'Pedro',
    gender: 'M',
    avatar: '🧔🏼',
    hobby: 'Arregla relojes antiguos',
    hobbyEmoji: '⏰',
  },
  {
    id: 'isabel',
    name: 'Isabel',
    gender: 'F',
    avatar: '👩🏻',
    hobby: 'Pinta cuadros de acuarela',
    hobbyEmoji: '🎨',
  },
  {
    id: 'javier',
    name: 'Javier',
    gender: 'M',
    avatar: '🧔🏽',
    hobby: 'Restaura muebles de madera',
    hobbyEmoji: '🪑',
  },
  {
    id: 'fatima',
    name: 'Fátima',
    gender: 'F',
    avatar: '🧕🏽',
    hobby: 'Hace ricos dulces de almendra',
    hobbyEmoji: '🍯',
  },
  {
    id: 'amadou',
    name: 'Amadou',
    gender: 'M',
    avatar: '👨🏾',
    hobby: 'Toca el tambor con mucho ritmo',
    hobbyEmoji: '🥁',
  },
  {
    id: 'marta',
    name: 'Marta',
    gender: 'F',
    avatar: '👩🏽',
    hobby: 'Baila sevillanas en las fiestas',
    hobbyEmoji: '💃',
  },
  {
    id: 'carlos',
    name: 'Carlos',
    gender: 'M',
    avatar: '👨🏽',
    hobby: 'Cocina una paella deliciosa',
    hobbyEmoji: '🥘',
  },
  {
    id: 'rosa',
    name: 'Rosa',
    gender: 'F',
    avatar: '👩',
    hobby: 'Cuida a los perritos del refugio',
    hobbyEmoji: '🐶',
  },
  {
    id: 'kenji',
    name: 'Kenji',
    gender: 'M',
    avatar: '👨🏻',
    hobby: 'Hace figuras de papiroflexia',
    hobbyEmoji: '📜',
  },
  {
    id: 'mei',
    name: 'Mei',
    gender: 'F',
    avatar: '👩🏻',
    hobby: 'Prepara té verde aromático',
    hobbyEmoji: '🍵',
  },
  {
    id: 'samuel',
    name: 'Samuel',
    gender: 'M',
    avatar: '👨🏿',
    hobby: 'Cuenta historias a la familia',
    hobbyEmoji: '📚',
  },
  {
    id: 'lucia-adulta',
    name: 'Lucía',
    gender: 'F',
    avatar: '👩🏼',
    hobby: 'Toca el piano con alegría',
    hobbyEmoji: '🎹',
  },

  // Young people & teenagers
  {
    id: 'david',
    name: 'David',
    gender: 'M',
    avatar: '👦🏼',
    hobby: 'Juega al fútbol con su equipo',
    hobbyEmoji: '⚽',
  },
  {
    id: 'elena',
    name: 'Elena',
    gender: 'F',
    avatar: '👧🏽',
    hobby: 'Le gusta patinar por el paseo',
    hobbyEmoji: '🛼',
  },
  {
    id: 'alberto',
    name: 'Alberto',
    gender: 'M',
    avatar: '👦🏻',
    hobby: 'Monta en bicicleta los domingos',
    hobbyEmoji: '🚲',
  },
  {
    id: 'clara',
    name: 'Clara',
    gender: 'F',
    avatar: '👧',
    hobby: 'Canta canciones bonitas',
    hobbyEmoji: '🎤',
  },
  {
    id: 'lucas',
    name: 'Lucas',
    gender: 'M',
    avatar: '👦',
    hobby: 'Dibuja paisajes de colores',
    hobbyEmoji: '🖍️',
  },
  {
    id: 'mariama',
    name: 'Mariama',
    gender: 'F',
    avatar: '👧🏿',
    hobby: 'Lee libros de aventuras',
    hobbyEmoji: '📖',
  },
]

function getInitialTargets(): Person[] {
  return shuffle(PEOPLE_DATABASE).slice(0, 3)
}

export function FacesAndNames({ onComplete, onExit }: Props) {
  const [round, setRound] = useState(0) // 0: 4 faces, 1: 6 faces, 2: 9 faces
  const [sessionTargets, setSessionTargets] = useState<Person[]>(getInitialTargets)
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize')
  const [choices, setChoices] = useState<Person[]>([])
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]) // Staggered reveal tracker
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const isAdvancingRef = useRef(false)
  const timeoutsRef = useRef<number[]>([])
  const lastTargetSlotRef = useRef<number | null>(null) // Ensures target face doesn't repeat the same slot

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id))
    timeoutsRef.current = []
  }

  const addTimeout = (fn: () => void, delayMs: number) => {
    const id = window.setTimeout(fn, delayMs)
    timeoutsRef.current.push(id)
    return id
  }

  // Configure choices and speak whenever round changes
  useEffect(() => {
    clearAllTimeouts()

    const target = sessionTargets[round]
    if (!target) return

    const choiceCount = round === 0 ? 4 : round === 1 ? 6 : 9
    const poolWithoutTarget = PEOPLE_DATABASE.filter((p) => p.id !== target.id)
    const shuffledDistractors = shuffle(poolWithoutTarget)
    const distractors = shuffledDistractors.slice(0, choiceCount - 1)

    // Guarantee that target does not land in the exact same slot index as in the previous round
    const allSlots = Array.from({ length: choiceCount }, (_, i) => i)
    const eligibleSlots =
      lastTargetSlotRef.current !== null && choiceCount > 1
        ? allSlots.filter((slot) => slot !== lastTargetSlotRef.current)
        : allSlots

    const chosenTargetSlot =
      eligibleSlots.length > 0
        ? eligibleSlots[Math.floor(Math.random() * eligibleSlots.length)]
        : Math.floor(Math.random() * choiceCount)

    lastTargetSlotRef.current = chosenTargetSlot

    // Populate choices grid placing the target at chosenTargetSlot
    const choiceArray: Person[] = new Array(choiceCount)
    choiceArray[chosenTargetSlot] = target
    let distIdx = 0
    for (let i = 0; i < choiceCount; i++) {
      if (i !== chosenTargetSlot) {
        choiceArray[i] = distractors[distIdx++]
      }
    }

    setChoices(choiceArray)
    setVisibleIndices([])
    setPhase('memorize')
    setFeedback('')
    isAdvancingRef.current = false

    const pronoun = target.gender === 'M' ? 'Él es' : 'Ella es'

    // 250ms delay ensures speech synthesis is ready and DOM mounted
    const timer = setTimeout(() => {
      speech.speak(`${pronoun} ${target.name}. ${target.hobby}. Recuerda su cara.`)
    }, 250)

    return () => {
      clearTimeout(timer)
      clearAllTimeouts()
      speech.stop()
    }
  }, [round, sessionTargets])

  const initGame = () => {
    clearAllTimeouts()
    lastTargetSlotRef.current = null
    const fresh = getInitialTargets()
    setSessionTargets(fresh)
    setRound(0)
    setVisibleIndices([])
    setIsSuccess(false)
  }

  const currentTarget = sessionTargets[round] || sessionTargets[0]
  if (!currentTarget) return null

  const handleFinishMemorize = () => {
    sound.playTap()
    clearAllTimeouts()
    setPhase('recall')
    setVisibleIndices([])

    speech.speak(`¿Quién es ${currentTarget.name}? Toca su cara.`)

    // Staggered appearance in randomized slot order so they don't appear in predictable top-to-bottom sequence
    const delayBetween = choices.length === 4 ? 200 : choices.length === 6 ? 180 : 150
    const randomizedRevealOrder = shuffle(Array.from({ length: choices.length }, (_, i) => i))

    randomizedRevealOrder.forEach((slotIdx, step) => {
      addTimeout(() => {
        sound.playTap()
        setVisibleIndices((prev) => (prev.includes(slotIdx) ? prev : [...prev, slotIdx]))
      }, 150 + step * delayBetween)
    })
  }

  const handleSelectPerson = (person: Person) => {
    if (isAdvancingRef.current) return
    sound.playTap()

    if (person.id === currentTarget.id) {
      isAdvancingRef.current = true
      sound.playSuccess()
      const praise = `¡Exacto! Esa cara es de ${currentTarget.name}.`
      setFeedback(praise)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (round + 1 < sessionTargets.length) {
            setRound(round + 1)
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
      setFeedback(`Esa persona es ${person.name}. Busca la cara de ${currentTarget.name}.`)
      speech.speak(`Esa persona es ${person.name}. Busca a ${currentTarget.name}.`)
    }
  }

  const pronoun = currentTarget.gender === 'M' ? 'Él es' : 'Ella es'
  const choiceCount = round === 0 ? 4 : round === 1 ? 6 : 9

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl mx-auto overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-4 border-2 sm:border-3 border-pink-300 mb-1.5 sm:mb-4 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Ronda:</span>
          <span className="px-2.5 sm:px-4 py-1 sm:py-2 bg-pink-100 text-pink-950 font-black rounded-xl sm:rounded-2xl text-sm sm:text-2xl">
            {round + 1} de 3 ({choiceCount} caras)
          </span>
        </div>

        <SpeakerButton
          text={
            phase === 'memorize'
              ? `${pronoun} ${currentTarget.name}. ${currentTarget.hobby}.`
              : `¿Quién es ${currentTarget.name}? Toca su cara entre las ${choiceCount} opciones.`
          }
          label="Escuchar"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-pink-400 rounded-2xl sm:rounded-3xl p-2.5 sm:p-7 shadow-md text-center min-h-0 overflow-hidden">
        {phase === 'memorize' ? (
          <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
            <div className="inline-flex items-center justify-center gap-2 text-pink-950 font-black text-base sm:text-3xl mb-1 shrink-0">
              <Eye className="w-6 h-6 sm:w-10 sm:h-10 text-pink-600 stroke-[2.5]" />
              <span>Recuerda su cara:</span>
            </div>

            <div className="bg-pink-50 border-2 sm:border-4 border-pink-300 rounded-2xl sm:rounded-3xl p-3 sm:p-6 max-w-xs sm:max-w-sm mx-auto my-auto shadow-sm shrink-0">
              <div className="text-6xl sm:text-8xl mb-1 sm:mb-2 select-none animate-in zoom-in-75 duration-300">
                {cleanAvatar(currentTarget.avatar)}
              </div>
              <h4 className="font-black text-pink-950 text-xl sm:text-4xl mb-0.5 sm:mb-1">
                {currentTarget.name}
              </h4>
              <p className="text-stone-800 font-bold text-xs sm:text-xl">
                {currentTarget.hobby} {currentTarget.hobbyEmoji}
              </p>
            </div>

            <button
              onClick={handleFinishMemorize}
              className="w-full py-3 sm:py-5 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-3xl shadow-md border-2 sm:border-3 border-pink-700 transition-all active:scale-95 cursor-pointer min-h-[50px] sm:min-h-[72px] shrink-0 mt-auto"
            >
              ¡Listo! Elegir su cara →
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
            <div className="inline-flex items-center justify-center gap-2 text-stone-950 font-black text-base sm:text-3xl mb-1 shrink-0">
              <HelpCircle className="w-6 h-6 sm:w-10 sm:h-10 text-pink-600 stroke-[2.5]" />
              <span>¿Quién es {currentTarget.name}?</span>
            </div>

            {feedback && (
              <div className="p-1.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-xs sm:text-xl mb-1 sm:mb-3 animate-in fade-in shrink-0">
                {feedback}
              </div>
            )}

            {/* Grid displaying the face cards appearing poco a poco */}
            <div
              className={`grid gap-1.5 sm:gap-3 max-w-md mx-auto flex-1 min-h-0 my-auto items-center justify-center w-full ${
                choiceCount === 4 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {choices.map((person, idx) => {
                const isVisible = visibleIndices.includes(idx)
                return (
                  <button
                    key={person.id}
                    disabled={!isVisible || isAdvancingRef.current}
                    onClick={() => handleSelectPerson(person)}
                    className={`border-2 sm:border-4 rounded-2xl sm:rounded-3xl p-1 sm:p-3 flex items-center justify-center shadow-xs sm:shadow-md transition-all h-full min-h-[58px] sm:min-h-[110px] ${
                      isVisible
                        ? 'bg-stone-50 hover:bg-pink-50 border-stone-300 hover:border-pink-500 cursor-pointer active:scale-95'
                        : 'bg-pink-50/50 border-dashed border-pink-200 cursor-default'
                    }`}
                    aria-label={isVisible ? `Cara de ${person.name}` : 'Tarjeta por descubrir'}
                  >
                    {isVisible ? (
                      <span
                        className={`select-none animate-in zoom-in-75 fade-in duration-300 ${
                          choiceCount === 9
                            ? 'text-4xl sm:text-6xl'
                            : choiceCount === 6
                            ? 'text-5xl sm:text-7xl'
                            : 'text-5xl sm:text-8xl'
                        }`}
                      >
                        {cleanAvatar(person.avatar)}
                      </span>
                    ) : (
                      <span className="text-pink-300 font-black text-2xl sm:text-4xl select-none opacity-40 animate-pulse">
                        ?
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has recordado todas las caras con gran agudeza visual."
          onRestart={initGame}
          onHome={onExit}
        />
      )}
    </div>
  )
}
