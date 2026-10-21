import { useState, useEffect, useRef } from 'react'
import { Eye, HelpCircle, RotateCcw, Play } from 'lucide-react'
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
  const [isCardFlipped, setIsCardFlipped] = useState(false) // 3D card flip tracker
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

  const currentTarget = sessionTargets[round] || sessionTargets[0]

  const triggerRecall = (choicesList: Person[], targetPerson: Person) => {
    clearAllTimeouts()
    setPhase('recall')
    setVisibleIndices([])
    speech.speak(`¿Quién es ${targetPerson.name}? Toca su cara.`)

    // Staggered reveal in randomized order so they don't appear in predictable top-to-bottom sequence
    const delayBetween = choicesList.length === 4 ? 200 : choicesList.length === 6 ? 180 : 150
    const randomizedRevealOrder = shuffle(Array.from({ length: choicesList.length }, (_, i) => i))

    randomizedRevealOrder.forEach((slotIdx, step) => {
      addTimeout(() => {
        sound.playTap()
        setVisibleIndices((prev) => (prev.includes(slotIdx) ? prev : [...prev, slotIdx]))
      }, 150 + step * delayBetween)
    })
  }

  // Configure choices and manage 1.5s viewing duration before card flips
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
    setIsCardFlipped(false)
    setPhase('memorize')
    setFeedback('')
    isAdvancingRef.current = false

    // Initial voice prompt
    addTimeout(() => {
      speech.speak(`${target.name}. ¡Recuerda su cara!`)
    }, 150)

    // Visualise face for 1.5 seconds (1500ms), and afterwards flip the card
    addTimeout(() => {
      sound.playTap()
      setIsCardFlipped(true)
      // Voice prompts user to click play when ready
      addTimeout(() => {
        speech.speak('Tarjeta volteada. Pulsa jugar para adivinar su cara.')
      }, 700)
    }, 1650) // 150ms mount buffer + 1500ms viewing = 1650ms

    // IMPORTANT: Wait for the user to press the play button! Do not auto-advance.

    return () => {
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
    setIsCardFlipped(false)
    setIsSuccess(false)
  }

  // Triggered when user clicks the "¡Jugar!" button once the card is flipped
  const handleStartGuessing = () => {
    sound.playTap()
    triggerRecall(choices, currentTarget)
  }

  // Allows user to peek at the face again for 1.5 seconds if they forgot
  const handleShowFaceAgain = () => {
    if (isAdvancingRef.current || !currentTarget) return
    clearAllTimeouts()
    speech.stop()
    sound.playTap()

    setIsCardFlipped(false)
    setPhase('memorize')

    addTimeout(() => {
      speech.speak(`${currentTarget.name}. ¡Recuerda su cara!`)
    }, 100)

    // Show for 1.5s, then flip again and wait for play button
    addTimeout(() => {
      sound.playTap()
      setIsCardFlipped(true)
      addTimeout(() => {
        speech.speak('Pulsa jugar para buscar su cara.')
      }, 700)
    }, 1600)
  }

  const handleSelectPerson = (person: Person) => {
    if (isAdvancingRef.current || !currentTarget) return
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

  if (!currentTarget) return null

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
              ? isCardFlipped
                ? `La tarjeta ya está volteada. Pulsa el botón verde de jugar para adivinar la cara de ${currentTarget.name}.`
                : `${pronoun} ${currentTarget.name}. ${currentTarget.hobby}.`
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
              <span>
                {isCardFlipped ? `¿Recuerdas a ${currentTarget.name}?` : 'Recuerda su cara (1,5 s):'}
              </span>
            </div>

            {/* 3D Flip Card Container */}
            <div
              style={{ perspective: '1000px' }}
              className="w-full max-w-xs sm:max-w-sm mx-auto my-auto flex-1 flex flex-col justify-center min-h-0"
            >
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
                className="relative w-full aspect-square max-h-[210px] sm:max-h-[300px] mx-auto"
              >
                {/* Front Face: Person's Avatar, Name & Hobby */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className="absolute inset-0 bg-pink-50 border-3 sm:border-4 border-pink-300 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-md flex flex-col items-center justify-center text-center select-none"
                >
                  <span className="text-6xl sm:text-8xl mb-1 sm:mb-2 select-none animate-in zoom-in-75 duration-300">
                    {cleanAvatar(currentTarget.avatar)}
                  </span>
                  <h4 className="font-black text-pink-950 text-xl sm:text-3xl mb-0.5 sm:mb-1">
                    {currentTarget.name}
                  </h4>
                  <p className="text-stone-700 font-bold text-xs sm:text-lg">
                    {currentTarget.hobby} {currentTarget.hobbyEmoji}
                  </p>

                  {/* Visual 1.5s countdown bar */}
                  <div className="w-32 sm:w-48 h-1.5 sm:h-2.5 bg-pink-200 rounded-full mt-2 sm:mt-4 overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full"
                      style={{
                        width: isCardFlipped ? '0%' : '100%',
                        transition: 'width 1500ms linear',
                      }}
                    />
                  </div>
                </div>

                {/* Back Face: Flipped Card Back */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-500 border-3 sm:border-4 border-pink-300 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-md flex flex-col items-center justify-center text-center select-none"
                >
                  <span className="text-white font-black text-6xl sm:text-8xl select-none">
                    ?
                  </span>
                  <span className="text-white font-bold text-sm sm:text-xl mt-1 opacity-90">
                    ¿Quién era?
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom action: Waits for user to click play button once flipped */}
            <div className="shrink-0 mt-2 sm:mt-4 min-h-[50px] sm:min-h-[70px] flex items-center justify-center">
              {isCardFlipped ? (
                <button
                  onClick={handleStartGuessing}
                  className="w-full py-3 sm:py-5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl sm:rounded-3xl font-black text-base sm:text-2xl shadow-md border-2 sm:border-3 border-emerald-700 transition-all active:scale-95 cursor-pointer min-h-[48px] sm:min-h-[68px] animate-in fade-in zoom-in-95 duration-200 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 sm:w-7 sm:h-7 fill-white" />
                  <span>¡Jugar! Adivinar su cara →</span>
                </button>
              ) : (
                <p className="text-xs sm:text-base font-bold text-stone-500 py-2">
                  ¡Fíjate bien antes de que se voltee!
                </p>
              )}
            </div>
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

            {/* Action control in recall phase to re-view the face for 1.5s if forgotten */}
            <div className="flex justify-center mt-1.5 sm:mt-3 shrink-0">
              <button
                onClick={handleShowFaceAgain}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-pink-50 hover:bg-pink-100 text-pink-950 font-bold text-xs sm:text-base rounded-xl sm:rounded-2xl border-2 border-pink-300 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-pink-700" />
                <span>¿No lo recuerdas? Volver a ver la cara</span>
              </button>
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
