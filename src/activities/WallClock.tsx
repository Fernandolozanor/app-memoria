import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_PRAISES, GENERAL_RETRIES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface TimeSpec {
  hours: number // 1..12
  minutes: number // 0..59
}

interface ClockQuestion {
  promptTitle: string
  spokenPrompt: string
  contextNote: string
  emoji: string
  target: TimeSpec
  distractors: TimeSpec[]
}

// Ronda 1: Horas en punto y medias con trampa de agujas invertidas y horas vecinas (3 opciones)
const ROUND_1_POOL: ClockQuestion[] = [
  {
    promptTitle: 'Las 3 en punto',
    spokenPrompt: '¿Qué reloj marca las tres en punto de la tarde?',
    contextNote: '☕ Hora del café de sobremesa',
    emoji: '☕',
    target: { hours: 3, minutes: 0 },
    distractors: [
      { hours: 12, minutes: 15 }, // Agujas invertidas (corta al 12, larga al 3)
      { hours: 4, minutes: 0 },   // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 5 en punto',
    spokenPrompt: '¿Qué reloj marca las cinco en punto de la tarde?',
    contextNote: '🍪 Hora de la merienda o del paseo',
    emoji: '🍪',
    target: { hours: 5, minutes: 0 },
    distractors: [
      { hours: 12, minutes: 25 }, // Agujas invertidas
      { hours: 6, minutes: 0 },   // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 8 en punto',
    spokenPrompt: '¿Qué reloj marca las ocho en punto de la mañana?',
    contextNote: '🥐 Buenos días, hora del desayuno',
    emoji: '🥐',
    target: { hours: 8, minutes: 0 },
    distractors: [
      { hours: 12, minutes: 40 }, // Agujas invertidas
      { hours: 7, minutes: 0 },   // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 10 en punto',
    spokenPrompt: '¿Qué reloj marca las diez en punto de la mañana?',
    contextNote: '🛒 Salir a hacer los recados',
    emoji: '🛒',
    target: { hours: 10, minutes: 0 },
    distractors: [
      { hours: 12, minutes: 50 }, // Agujas invertidas
      { hours: 9, minutes: 0 },   // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 2 en punto',
    spokenPrompt: '¿Qué reloj marca las dos en punto del mediodía?',
    contextNote: '🍲 Hora de sentarse a comer',
    emoji: '🍲',
    target: { hours: 2, minutes: 0 },
    distractors: [
      { hours: 12, minutes: 10 }, // Agujas invertidas
      { hours: 1, minutes: 0 },   // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 4 y media',
    spokenPrompt: '¿Qué reloj marca las cuatro y media de la tarde?',
    contextNote: '📖 Momento de lectura tranquila',
    emoji: '📖',
    target: { hours: 4, minutes: 30 },
    distractors: [
      { hours: 6, minutes: 20 }, // Agujas invertidas
      { hours: 5, minutes: 30 }, // Hora vecina
    ],
  },
  {
    promptTitle: 'La 1 y media',
    spokenPrompt: '¿Qué reloj marca la una y media del mediodía?',
    contextNote: '🥖 Poner la mesa para la comida',
    emoji: '🥖',
    target: { hours: 1, minutes: 30 },
    distractors: [
      { hours: 6, minutes: 5 },  // Agujas invertidas
      { hours: 12, minutes: 30 }, // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 8 y media',
    spokenPrompt: '¿Qué reloj marca las ocho y media de la tarde?',
    contextNote: '🍽️ Preparar la cena en casa',
    emoji: '🍽️',
    target: { hours: 8, minutes: 30 },
    distractors: [
      { hours: 6, minutes: 40 }, // Agujas invertidas
      { hours: 7, minutes: 30 }, // Hora vecina
    ],
  },
]

// Ronda 2: Cuartos y Menos cuarto con trampa de avance horario (4 opciones)
const ROUND_2_POOL: ClockQuestion[] = [
  {
    promptTitle: 'Las 7 menos cuarto',
    spokenPrompt: '¿Qué reloj marca las siete menos cuarto?',
    contextNote: '☕ Faltan 15 minutos para las siete',
    emoji: '☕',
    target: { hours: 6, minutes: 45 },
    distractors: [
      { hours: 7, minutes: 45 }, // Las ocho menos cuarto
      { hours: 6, minutes: 15 }, // Las seis y cuarto
      { hours: 9, minutes: 35 }, // Agujas invertidas
    ],
  },
  {
    promptTitle: 'Las 4 y cuarto',
    spokenPrompt: '¿Qué reloj marca las cuatro y cuarto de la tarde?',
    contextNote: '📺 Quince minutos pasados de las cuatro',
    emoji: '📺',
    target: { hours: 4, minutes: 15 },
    distractors: [
      { hours: 3, minutes: 45 }, // Las cuatro menos cuarto
      { hours: 5, minutes: 15 }, // Hora vecina
      { hours: 3, minutes: 20 }, // Agujas invertidas
    ],
  },
  {
    promptTitle: 'Las 10 menos cuarto',
    spokenPrompt: '¿Qué reloj marca las diez menos cuarto de la mañana?',
    contextNote: '🚶 Falta un cuarto de hora para las diez',
    emoji: '🚶',
    target: { hours: 9, minutes: 45 },
    distractors: [
      { hours: 10, minutes: 45 }, // Las once menos cuarto
      { hours: 9, minutes: 15 },  // Las nueve y cuarto
      { hours: 10, minutes: 15 }, // Hora vecina y cuarto
    ],
  },
  {
    promptTitle: 'Las 2 y cuarto',
    spokenPrompt: '¿Qué reloj marca las dos y cuarto del mediodía?',
    contextNote: '🍽️ Buen provecho con la comida',
    emoji: '🍽️',
    target: { hours: 2, minutes: 15 },
    distractors: [
      { hours: 1, minutes: 45 }, // Las dos menos cuarto
      { hours: 3, minutes: 15 }, // Hora vecina
      { hours: 2, minutes: 45 }, // Las tres menos cuarto
    ],
  },
  {
    promptTitle: 'Las 12 menos cuarto',
    spokenPrompt: '¿Qué reloj marca las doce menos cuarto del mediodía?',
    contextNote: '☀️ Falta poco para el mediodía',
    emoji: '☀️',
    target: { hours: 11, minutes: 45 },
    distractors: [
      { hours: 12, minutes: 45 }, // La una menos cuarto
      { hours: 11, minutes: 15 }, // Las once y cuarto
      { hours: 12, minutes: 15 }, // Las doce y cuarto
    ],
  },
  {
    promptTitle: 'Las 8 y cuarto',
    spokenPrompt: '¿Qué reloj marca las ocho y cuarto?',
    contextNote: '🍞 Tostadas y café recién hecho',
    emoji: '🍞',
    target: { hours: 8, minutes: 15 },
    distractors: [
      { hours: 7, minutes: 45 }, // Las ocho menos cuarto
      { hours: 8, minutes: 45 }, // Las nueve menos cuarto
      { hours: 9, minutes: 15 }, // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 6 menos cuarto',
    spokenPrompt: '¿Qué reloj marca las seis menos cuarto de la tarde?',
    contextNote: '🌅 Cae la tarde despacito',
    emoji: '🌅',
    target: { hours: 5, minutes: 45 },
    distractors: [
      { hours: 6, minutes: 45 }, // Las siete menos cuarto
      { hours: 5, minutes: 15 }, // Las cinco y cuarto
      { hours: 6, minutes: 15 }, // Las seis y cuarto
    ],
  },
]

// Ronda 3: Minutos de la vida cotidiana (y diez, y veinte, menos veinte, menos diez) (4 opciones)
const ROUND_3_POOL: ClockQuestion[] = [
  {
    promptTitle: 'Las 8 y diez',
    spokenPrompt: '¿Qué reloj marca las ocho y diez de la mañana?',
    contextNote: '🥐 La aguja larga roja apunta al número 2',
    emoji: '🥐',
    target: { hours: 8, minutes: 10 },
    distractors: [
      { hours: 8, minutes: 50 }, // Las nueve menos diez
      { hours: 9, minutes: 10 }, // Hora vecina
      { hours: 8, minutes: 15 }, // Las ocho y cuarto
    ],
  },
  {
    promptTitle: 'Las 5 y veinte',
    spokenPrompt: '¿Qué reloj marca las cinco y veinte de la tarde?',
    contextNote: '🍪 La aguja larga roja apunta al número 4',
    emoji: '🍪',
    target: { hours: 5, minutes: 20 },
    distractors: [
      { hours: 5, minutes: 40 }, // Las seis menos veinte
      { hours: 5, minutes: 30 }, // Las cinco y media
      { hours: 4, minutes: 25 }, // Agujas invertidas
    ],
  },
  {
    promptTitle: 'Las 10 menos diez',
    spokenPrompt: '¿Qué reloj marca las diez menos diez de la mañana?',
    contextNote: '🛒 Faltan diez minutos para las diez',
    emoji: '🛒',
    target: { hours: 9, minutes: 50 },
    distractors: [
      { hours: 9, minutes: 10 },  // Las nueve y diez
      { hours: 10, minutes: 50 }, // Las once menos diez
      { hours: 9, minutes: 45 },  // Las diez menos cuarto
    ],
  },
  {
    promptTitle: 'Las 7 menos veinte',
    spokenPrompt: '¿Qué reloj marca las siete menos veinte de la tarde?',
    contextNote: '🌳 La aguja larga roja apunta al número 8',
    emoji: '🌳',
    target: { hours: 6, minutes: 40 },
    distractors: [
      { hours: 6, minutes: 20 }, // Las seis y veinte
      { hours: 7, minutes: 40 }, // Las ocho menos veinte
      { hours: 6, minutes: 45 }, // Las siete menos cuarto
    ],
  },
  {
    promptTitle: 'Las 11 y diez',
    spokenPrompt: '¿Qué reloj marca las once y diez de la mañana?',
    contextNote: '📰 Diez minutos pasados de las once',
    emoji: '📰',
    target: { hours: 11, minutes: 10 },
    distractors: [
      { hours: 11, minutes: 50 }, // Las doce menos diez
      { hours: 11, minutes: 15 }, // Las once y cuarto
      { hours: 10, minutes: 10 }, // Hora vecina
    ],
  },
  {
    promptTitle: 'La 1 y veinte',
    spokenPrompt: '¿Qué reloj marca la una y veinte del mediodía?',
    contextNote: '🥖 Veinte minutos pasados de la una',
    emoji: '🥖',
    target: { hours: 1, minutes: 20 },
    distractors: [
      { hours: 1, minutes: 40 }, // Las dos menos veinte
      { hours: 1, minutes: 15 }, // La una y cuarto
      { hours: 2, minutes: 20 }, // Hora vecina
    ],
  },
  {
    promptTitle: 'Las 4 menos diez',
    spokenPrompt: '¿Qué reloj marca las cuatro menos diez de la tarde?',
    contextNote: '🛋️ Faltan diez minutos para las cuatro',
    emoji: '🛋️',
    target: { hours: 3, minutes: 50 },
    distractors: [
      { hours: 3, minutes: 10 }, // Las tres y diez
      { hours: 4, minutes: 50 }, // Las cinco menos diez
      { hours: 3, minutes: 45 }, // Las cuatro menos cuarto
    ],
  },
]

// Ronda 4: Problemas y cálculo mental del tiempo en situaciones cotidianas (4 opciones)
const ROUND_4_POOL: ClockQuestion[] = [
  {
    promptTitle: 'El asado en el horno',
    spokenPrompt:
      'Metemos el asado al horno a las dos en punto y tarda media hora en hacerse. ¿A qué hora debemos sacarlo?',
    contextNote: '🍗 Se mete a las 2:00 y tarda media hora',
    emoji: '🍗',
    target: { hours: 2, minutes: 30 },
    distractors: [
      { hours: 2, minutes: 0 },
      { hours: 3, minutes: 0 },
      { hours: 1, minutes: 30 },
    ],
  },
  {
    promptTitle: 'Llegada del autobús',
    spokenPrompt:
      'El autobús sale a las cinco y cuarto de la tarde y el viaje dura media hora. ¿A qué hora llegamos al pueblo?',
    contextNote: '🚌 Sale a las 5:15 y el viaje dura media hora',
    emoji: '🚌',
    target: { hours: 5, minutes: 45 },
    distractors: [
      { hours: 5, minutes: 15 },
      { hours: 6, minutes: 15 },
      { hours: 6, minutes: 0 },
    ],
  },
  {
    promptTitle: 'Cita en el centro médico',
    spokenPrompt:
      'Tenemos cita médica a las once en punto, pero hemos llegado quince minutos antes para esperar con calma. ¿Qué hora es?',
    contextNote: '🩺 La cita es a las 11:00 y llegamos 15 minutos antes',
    emoji: '🩺',
    target: { hours: 10, minutes: 45 },
    distractors: [
      { hours: 11, minutes: 0 },
      { hours: 11, minutes: 15 },
      { hours: 10, minutes: 15 },
    ],
  },
  {
    promptTitle: 'El bizcocho al horno',
    spokenPrompt:
      'Metemos un bizcocho al horno a las cuatro y cuarto. Tiene que cocer durante cuarenta y cinco minutos. ¿A qué hora estará listo?',
    contextNote: '🥧 Entra a las 4:15 y hornea 45 minutos',
    emoji: '🥧',
    target: { hours: 5, minutes: 0 },
    distractors: [
      { hours: 4, minutes: 15 },
      { hours: 5, minutes: 30 },
      { hours: 4, minutes: 45 },
    ],
  },
  {
    promptTitle: 'Paseo por el parque',
    spokenPrompt:
      'Salimos a dar un paseo por el parque a las seis de la tarde y caminamos durante una hora entera. ¿A qué hora volvemos a casa?',
    contextNote: '🌳 Salimos a las 6:00 y paseamos 1 hora entera',
    emoji: '🌳',
    target: { hours: 7, minutes: 0 },
    distractors: [
      { hours: 6, minutes: 30 },
      { hours: 7, minutes: 30 },
      { hours: 8, minutes: 0 },
    ],
  },
  {
    promptTitle: 'Quedada para merendar',
    spokenPrompt:
      'Hemos quedado a merendar a las cinco en punto de la tarde, pero nuestro acompañante se retrasa veinte minutos. ¿A qué hora llega?',
    contextNote: '☕ Quedamos a las 5:00 pero se retrasa 20 minutos',
    emoji: '☕',
    target: { hours: 5, minutes: 20 },
    distractors: [
      { hours: 5, minutes: 0 },
      { hours: 5, minutes: 40 },
      { hours: 4, minutes: 40 },
    ],
  },
  {
    promptTitle: 'La película de la tele',
    spokenPrompt:
      'La película de la noche empieza a las diez en punto y dura una hora y media. ¿Qué reloj marca la hora en que termina?',
    contextNote: '📺 Empieza a las 10:00 y dura hora y media',
    emoji: '📺',
    target: { hours: 11, minutes: 30 },
    distractors: [
      { hours: 10, minutes: 0 },
      { hours: 11, minutes: 0 },
      { hours: 12, minutes: 0 },
    ],
  },
]

function timeKey(t: TimeSpec): string {
  return `${t.hours}:${t.minutes}`
}

function AnalogClockFace({ time }: { time: TimeSpec }) {
  const minuteAngle = time.minutes * 6
  const hourAngle = ((time.hours % 12) + time.minutes / 60) * 30

  const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-[220px] max-h-[220px] drop-shadow-sm">
      {/* Outer clock ring */}
      <circle cx="100" cy="100" r="95" fill="#FFFBEB" stroke="#1E3A8A" strokeWidth="7" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#93C5FD" strokeWidth="1.5" />

      {/* 60 Minute tick marks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const isHourTick = i % 5 === 0
        const angleRad = ((i * 6 - 90) * Math.PI) / 180
        const rOuter = 87
        const rInner = isHourTick ? 80 : 84
        const x1 = 100 + rOuter * Math.cos(angleRad)
        const y1 = 100 + rOuter * Math.sin(angleRad)
        const x2 = 100 + rInner * Math.cos(angleRad)
        const y2 = 100 + rInner * Math.sin(angleRad)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isHourTick ? '#1E3A8A' : '#94A3B8'}
            strokeWidth={isHourTick ? 2.5 : 1}
            strokeLinecap="round"
          />
        )
      })}

      {/* Hour numbers */}
      {numbers.map((num, idx) => {
        const angleRad = ((idx * 30 - 90) * Math.PI) / 180
        const radius = 68
        const x = 100 + radius * Math.cos(angleRad)
        const y = 100 + radius * Math.sin(angleRad)
        return (
          <text
            key={num}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0F172A"
            fontWeight="900"
            fontSize={num % 3 === 0 ? '22' : '17'}
          >
            {num}
          </text>
        )
      })}

      {/* Hour Hand (dark navy, thick, shorter) */}
      <g transform={`rotate(${hourAngle} 100 100)`}>
        <line
          x1="100"
          y1="108"
          x2="100"
          y2="54"
          stroke="#0F172A"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>

      {/* Minute Hand (crimson red, thinner, longer) */}
      <g transform={`rotate(${minuteAngle} 100 100)`}>
        <line
          x1="100"
          y1="112"
          x2="100"
          y2="28"
          stroke="#DC2626"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </g>

      {/* Center cap */}
      <circle cx="100" cy="100" r="7" fill="#0F172A" />
      <circle cx="100" cy="100" r="3" fill="#F59E0B" />
    </svg>
  )
}

export function WallClock({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [questions, setQuestions] = useState<ClockQuestion[]>([])
  const [options, setOptions] = useState<TimeSpec[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const initSession = () => {
    const q1 = pickRandom(ROUND_1_POOL)
    const q2 = pickRandom(ROUND_2_POOL)
    const q3 = pickRandom(ROUND_3_POOL)
    const q4 = pickRandom(ROUND_4_POOL)
    setQuestions([q1, q2, q3, q4])
    setRoundIdx(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    initSession()
    return () => speech.stop()
  }, [])

  useEffect(() => {
    if (questions.length === 0) return
    const q = questions[roundIdx] || questions[0]
    // Shuffle target with its smart distractors
    const all = [q.target, ...q.distractors].sort(() => 0.5 - Math.random())
    setOptions(all)
    setSelectedKey(null)
    setFeedback('')
    isAdvancingRef.current = false

    const timer = setTimeout(() => {
      speech.speak(q.spokenPrompt)
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, questions])

  if (questions.length === 0) return null
  const currentQ = questions[roundIdx] || questions[0]

  const handleSelectClock = (opt: TimeSpec) => {
    if (isAdvancingRef.current) return
    sound.playTap()
    const key = timeKey(opt)
    setSelectedKey(key)

    if (key === timeKey(currentQ.target)) {
      isAdvancingRef.current = true
      sound.playSuccess()
      const praise = pickRandom(GENERAL_PRAISES)
      setFeedback(praise)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (roundIdx + 1 < questions.length) {
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
      sound.playGentleRetry()
      const retry = pickRandom(GENERAL_RETRIES)
      setFeedback('Ese reloj marca otra hora. Fíjate en la aguja corta negra y en la larga roja.')
      speech.speak(retry)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-blue-400 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-4xl sm:text-6xl leading-none shrink-0">{currentQ.emoji}</span>
            <div className="text-left min-w-0">
              <h3 className="text-2xl sm:text-5xl font-black text-stone-950 leading-none">
                {currentQ.promptTitle}
              </h3>
              <p className="text-base sm:text-2xl font-bold text-blue-900 mt-0.5 truncate">
                {currentQ.contextNote}
              </p>
            </div>
          </div>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-blue-100 border-2 sm:border-3 border-blue-400 text-blue-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            {roundIdx + 1}/4
          </span>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-lg sm:text-3xl shrink-0">
            {feedback}
          </div>
        )}

        {/* Clocks Grid */}
        <div
          className={`flex-1 min-h-0 w-full grid gap-2.5 sm:gap-4 items-stretch ${
            options.length === 3
              ? 'grid-cols-3 grid-rows-1'
              : 'grid-cols-2 grid-rows-2'
          }`}
        >
          {options.map((opt) => {
            const key = timeKey(opt)
            const isChosen = selectedKey === key
            const isCorrect = key === timeKey(currentQ.target)

            let cardStyle =
              'bg-stone-50 hover:bg-blue-50 border-stone-300 hover:border-blue-500'
            if (isChosen) {
              cardStyle = isCorrect
                ? 'bg-emerald-100 border-emerald-600 ring-4 ring-emerald-300'
                : 'bg-amber-100 border-amber-500 opacity-75'
            }

            return (
              <button
                key={key}
                onClick={() => handleSelectClock(opt)}
                className={`w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 p-2 sm:p-4 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm ${cardStyle}`}
                aria-label={`Reloj ${opt.hours}:${opt.minutes.toString().padStart(2, '0')}`}
              >
                <AnalogClockFace time={opt} />
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Puntualidad perfecta!"
          message="Has acertado la hora en los relojes de pared durante las 4 rondas."
          onRestart={initSession}
          onHome={onExit}
        />
      )}
    </div>
  )
}


