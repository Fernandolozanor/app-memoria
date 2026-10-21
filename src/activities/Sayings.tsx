import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SpeakerButton } from '../components/SpeakerButton'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, SAYINGS_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface SayingItem {
  start: string
  correct: string
  wrong: string[]
}

// Gran catálogo de más de 45 refranes populares tradicionales (famosos y de toda la vida)
const SAYINGS_DATABASE: SayingItem[] = [
  {
    start: 'Más vale pájaro en mano...',
    correct: '...que ciento volando.',
    wrong: ['...que pluma en el viento.'],
  },
  {
    start: 'A quien madruga...',
    correct: '...Dios le ayuda.',
    wrong: ['...se le hace tarde.'],
  },
  {
    start: 'Al mal tiempo...',
    correct: '...buena cara.',
    wrong: ['...paraguas roto.'],
  },
  {
    start: 'En boca cerrada...',
    correct: '...no entran moscas.',
    wrong: ['...no hay canciones.'],
  },
  {
    start: 'Quien tiene un amigo...',
    correct: '...tiene un tesoro.',
    wrong: ['...duerme tranquilo.'],
  },
  {
    start: 'Zapatero...',
    correct: '...a tus zapatos.',
    wrong: ['...y buen sombrero.'],
  },
  {
    start: 'A caballo regalado...',
    correct: '...no le mires el diente.',
    wrong: ['...dale de comer.'],
  },
  {
    start: 'A buen entendedor...',
    correct: '...pocas palabras bastan.',
    wrong: ['...mucho hay que explicarle.'],
  },
  {
    start: 'A palabras necias...',
    correct: '...oídos sordos.',
    wrong: ['...respuestas claras.'],
  },
  {
    start: 'A la tercera...',
    correct: '...va la vencida.',
    wrong: ['...se acaba la fiesta.'],
  },
  {
    start: 'Agua que no has de beber...',
    correct: '...déjala correr.',
    wrong: ['...guárdala en el pozo.'],
  },
  {
    start: 'Año de nieves...',
    correct: '...año de bienes.',
    wrong: ['...abrigo y leña.'],
  },
  {
    start: 'Aunque la mona se vista de seda...',
    correct: '...mona se queda.',
    wrong: ['...bien guapa parece.'],
  },
  {
    start: 'Cada oveja...',
    correct: '...con su pareja.',
    wrong: ['...busca la hierba.'],
  },
  {
    start: 'Cría cuervos...',
    correct: '...y te sacarán los ojos.',
    wrong: ['...y volarán al campo.'],
  },
  {
    start: 'Cuando el río suena...',
    correct: '...agua lleva.',
    wrong: ['...peces tiene.'],
  },
  {
    start: 'De tal palo...',
    correct: '...tal astilla.',
    wrong: ['...buena madera.'],
  },
  {
    start: 'Del dicho al hecho...',
    correct: '...hay un buen trecho.',
    wrong: ['...se llega pronto.'],
  },
  {
    start: 'Dime con quién andas...',
    correct: '...y te diré quién eres.',
    wrong: ['...y daremos un paseo.'],
  },
  {
    start: 'El hábito...',
    correct: '...no hace al monje.',
    wrong: ['...abriga en invierno.'],
  },
  {
    start: 'El que no corre...',
    correct: '...vuela.',
    wrong: ['...camina despacio.'],
  },
  {
    start: 'El que la sigue...',
    correct: '...la consigue.',
    wrong: ['...se cansa pronto.'],
  },
  {
    start: 'En casa del herrero...',
    correct: '...cuchillo de palo.',
    wrong: ['...buena lumbre.'],
  },
  {
    start: 'Gato con guantes...',
    correct: '...no caza ratones.',
    wrong: ['...duerme caliente.'],
  },
  {
    start: 'Genio y figura...',
    correct: '...hasta la sepultura.',
    wrong: ['...con buena postura.'],
  },
  {
    start: 'Hasta el cuarenta de mayo...',
    correct: '...no te quites el sayo.',
    wrong: ['...no llega el verano.'],
  },
  {
    start: 'Hombre prevenido...',
    correct: '...vale por dos.',
    wrong: ['...llega primero.'],
  },
  {
    start: 'La avaricia...',
    correct: '...rompe el saco.',
    wrong: ['...llena la bolsa.'],
  },
  {
    start: 'Mal de muchos...',
    correct: '...consuelo de tontos.',
    wrong: ['...cura de sabios.'],
  },
  {
    start: 'Más vale tarde...',
    correct: '...que nunca.',
    wrong: ['...que llegar temprano.'],
  },
  {
    start: 'Más vale prevenir...',
    correct: '...que curar.',
    wrong: ['...que lamentar.'],
  },
  {
    start: 'No dejes para mañana...',
    correct: '...lo que puedas hacer hoy.',
    wrong: ['...el descanso de hoy.'],
  },
  {
    start: 'No por mucho madrugar...',
    correct: '...amanece más temprano.',
    wrong: ['...se hace de día.'],
  },
  {
    start: 'No hay mal...',
    correct: '...que cien años dure.',
    wrong: ['...que no traiga pena.'],
  },
  {
    start: 'Ojos que no ven...',
    correct: '...corazón que no siente.',
    wrong: ['...camino que se pierde.'],
  },
  {
    start: 'Perro ladrador...',
    correct: '...poco mordedor.',
    wrong: ['...amigo fiel.'],
  },
  {
    start: 'Por la boca...',
    correct: '...muere el pez.',
    wrong: ['...se come el pan.'],
  },
  {
    start: 'Quien mucho abarca...',
    correct: '...poco aprieta.',
    wrong: ['...más recoge.'],
  },
  {
    start: 'Quien ríe el último...',
    correct: '...ríe mejor.',
    wrong: ['...no tiene gracia.'],
  },
  {
    start: 'Quien siembra vientos...',
    correct: '...recoge tempestades.',
    wrong: ['...espera la lluvia.'],
  },
  {
    start: 'Sabe más el diablo por viejo...',
    correct: '...que por diablo.',
    wrong: ['...que por listo.'],
  },
  {
    start: 'Tanto va el cántaro a la fuente...',
    correct: '...que al final se rompe.',
    wrong: ['...que se llena de agua.'],
  },
  {
    start: 'Al pan, pan...',
    correct: '...y al vino, vino.',
    wrong: ['...y a la mesa, comida.'],
  },
  {
    start: 'Borrón...',
    correct: '...y cuenta nueva.',
    wrong: ['...y papel en blanco.'],
  },
  {
    start: 'A Dios rogando...',
    correct: '...y con el mazo dando.',
    wrong: ['...y la campana sonando.'],
  },
]

export function Sayings({ onComplete, onExit }: Props) {
  const [round, setRound] = useState(0)
  const [sessionSayings, setSessionSayings] = useState<SayingItem[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)

  const isAdvancingRef = useRef(false)
  const fallbackTimerRef = useRef<number | null>(null)

  const loadSaying = (item: SayingItem) => {
    setSelectedOption(null)
    setFeedback('')
    isAdvancingRef.current = false
    const wrong = item.wrong[0]
    const opts = [item.correct, wrong].sort(() => 0.5 - Math.random())
    setOptions(opts)

    // Automatically speak the prompt for this saying with varied phrasing
    const cleanStart = item.start.replace(/\.{3}/g, '').trim()
    const introVoice = pickRandom(SAYINGS_VOICES.intro)(cleanStart)
    speech.speak(introVoice)
  }

  const initGame = () => {
    // Shuffle the large database and pick 3 proverbs for this session
    const shuffled = [...SAYINGS_DATABASE].sort(() => 0.5 - Math.random())
    const selectedThree = shuffled.slice(0, 3)
    setSessionSayings(selectedThree)
    setRound(0)
    setIsSuccess(false)
    isAdvancingRef.current = false
    loadSaying(selectedThree[0])
  }

  useEffect(() => {
    // 200ms delay ensures speech synthesis engine and voices are fully ready on mount
    const timer = setTimeout(() => {
      initGame()
    }, 200)

    return () => {
      clearTimeout(timer)
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
      }
      speech.stop()
    }
  }, [])

  const handleNextStep = (currentRoundIdx: number, total: number) => {
    if (isAdvancingRef.current) return
    isAdvancingRef.current = true

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    setTimeout(() => {
      if (currentRoundIdx + 1 < total) {
        const nextRound = currentRoundIdx + 1
        setRound(nextRound)
        loadSaying(sessionSayings[nextRound])
      } else {
        setIsSuccess(true)
        onComplete()
      }
    }, 500)
  }

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null || isAdvancingRef.current) return
    sound.playTap()
    setSelectedOption(opt)

    const current = sessionSayings[round]
    if (opt === current.correct) {
      sound.playSuccess()
      setFeedback('¡Correcto!')

      const cleanStart = current.start.replace(/\.{3}/g, '').trim()
      const cleanCorrect = current.correct.replace(/\.{3}/g, '').trim()
      const praiseHeader = pickRandom(SAYINGS_VOICES.correctPraise)
      const fullText = `${praiseHeader} ${cleanStart} ${cleanCorrect}`

      // Wait until the voice finishes speaking before advancing
      speech.speak(fullText, () => {
        handleNextStep(round, sessionSayings.length)
      })

      // Fallback in case audio is interrupted
      fallbackTimerRef.current = window.setTimeout(() => {
        handleNextStep(round, sessionSayings.length)
      }, 7000)
    } else {
      sound.playGentleRetry()
      const retryVoice = pickRandom(SAYINGS_VOICES.wrong)
      setFeedback(retryVoice)
      speech.speak(retryVoice)
      setTimeout(() => {
        setSelectedOption(null)
      }, 1200)
    }
  }

  const currentSaying = sessionSayings[round]
  if (!currentSaying) return null

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl mx-auto overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-4 border-2 sm:border-3 border-emerald-300 mb-1.5 sm:mb-4 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Refrán:</span>
          <span className="px-2.5 sm:px-4 py-1 sm:py-2 bg-emerald-100 text-emerald-900 font-black rounded-xl sm:rounded-2xl text-sm sm:text-xl">
            {round + 1} de {sessionSayings.length}
          </span>
        </div>

        <SpeakerButton text={`${currentSaying.start} ¿Cómo termina?`} />
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-emerald-400 rounded-2xl sm:rounded-3xl p-3 sm:p-8 shadow-md text-center min-h-0 overflow-hidden">
        <h3 className="text-base sm:text-2xl font-black text-stone-800 shrink-0">
          ¿Cómo continúa?
        </h3>

        <div className="bg-emerald-50 border-2 sm:border-4 border-emerald-400 rounded-2xl sm:rounded-3xl p-3 sm:p-6 my-auto shrink-0">
          <p className="font-black text-emerald-950 text-xl sm:text-4xl leading-snug">
            "{currentSaying.start}"
          </p>
        </div>

        {feedback && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-sm sm:text-2xl mb-2 sm:mb-4 animate-in fade-in shrink-0">
            {feedback}
          </div>
        )}

        <div className="flex flex-col gap-2.5 sm:gap-4 shrink-0 mt-auto">
          {options.map((option, idx) => {
            const isChosen = selectedOption === option
            const isCorrect = option === currentSaying.correct

            let btnStyle = 'bg-stone-50 hover:bg-emerald-50 border-stone-300 hover:border-emerald-400 text-stone-900 shadow-xs sm:shadow-md'
            if (isChosen) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-600 border-emerald-700 text-white ring-2 sm:ring-4 ring-emerald-300 shadow-md'
              } else {
                btnStyle = 'bg-amber-100 border-amber-400 text-amber-950 opacity-70'
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedOption !== null && isCorrect}
                onClick={() => handleSelectOption(option)}
                className={`w-full p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border-3 sm:border-4 text-center font-black transition-all active:scale-[0.98] cursor-pointer min-h-[56px] sm:min-h-[84px] text-lg sm:text-3xl ${btnStyle}`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has recordado todos los refranes populares."
          onRestart={initGame}
          onHome={onExit}
        />
      )}
    </div>
  )
}
