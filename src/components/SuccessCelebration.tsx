import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Sparkles } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { getMistakes, resetMistakes } from '../services/sessionStats'

interface Props {
  title?: string
  message?: string
  onRestart?: () => void
  onHome: () => void
  // Multiplier for games where mistakes are a natural part of play (e.g. memory pairs)
  mistakeTolerance?: number
}

// Kind closing words adapted to how the game went. Never mention the number of mistakes.
const NEAR_PERFECT = [
  {
    title: '¡Muy bien hecho!',
    message: 'Has terminado la partida con muy buena cabeza. ¡Te ha salido casi redonda!',
  },
  {
    title: '¡Qué bien lo has hecho!',
    message: 'Un pequeño despiste no es nada. Has demostrado una memoria estupenda.',
  },
  {
    title: '¡Estupendo trabajo!',
    message: 'Lo has resuelto con mucha soltura. ¡Estás en muy buena forma!',
  },
]

const GOOD_EFFORT = [
  {
    title: '¡Buen trabajo!',
    message: 'Con calma y paciencia has llegado hasta el final. Cada partida te sale mejor.',
  },
  {
    title: '¡Lo has conseguido!',
    message: 'Has ido pensando cada paso con tranquilidad y lo has completado. ¡Muy bien!',
  },
  {
    title: '¡Muy buena partida!',
    message: 'Has sabido corregir sobre la marcha y terminar con éxito. Eso tiene mucho mérito.',
  },
]

const PERSEVERANCE = [
  {
    title: '¡Enhorabuena por tu constancia!',
    message: 'Lo importante es practicar, y hoy lo has hecho de maravilla. La próxima vez será aún más fácil.',
  },
  {
    title: '¡Has llegado al final!',
    message: 'No te has rendido y lo has terminado. Así se entrena la memoria, poco a poco.',
  },
  {
    title: '¡Qué bien que hayas seguido!',
    message: 'Era una partida difícil y la has completado con paciencia. ¡Mañana te saldrá todavía mejor!',
  },
]

function pickOne<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function SuccessCelebration({
  title = '¡Excelente trabajo!',
  message = 'Has completado esta actividad.',
  onHome,
  mistakeTolerance = 1,
}: Props) {
  // Decide the closing words once, based on how the game went
  const [content] = useState(() => {
    const m = getMistakes() / Math.max(1, mistakeTolerance)
    resetMistakes()
    if (m === 0) return { title, message }
    if (m <= 2) return pickOne(NEAR_PERFECT)
    if (m <= 5) return pickOne(GOOD_EFFORT)
    return pickOne(PERSEVERANCE)
  })

  const narration = `${content.title}. ${content.message}`
  const onHomeRef = useRef(onHome)
  onHomeRef.current = onHome

  useEffect(() => {
    let returned = false
    let postSpeechTimer: number | null = null

    const goHomeOnce = () => {
      if (returned) return
      returned = true
      onHomeRef.current()
    }

    sound.playVictoryJingle()
    try {
      confetti({
        particleCount: 65,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'],
      })
    } catch {
      // ignore
    }

    // Automatically speak the celebration right as the victory melody finishes (~2.3s),
    // and return automatically to the main menu once the voice finishes speaking.
    const speakTimer = window.setTimeout(() => {
      speech.speak(narration, () => {
        postSpeechTimer = window.setTimeout(goHomeOnce, 600)
      })
    }, 2300)

    // Safety fallback in case browser speech synthesis does not fire onend
    const fallbackMs = 2300 + Math.max(3500, speech.estimateDurationMs(narration) + 2000)
    const fallbackTimer = window.setTimeout(goHomeOnce, fallbackMs)

    return () => {
      clearTimeout(speakTimer)
      clearTimeout(fallbackTimer)
      if (postSpeechTimer !== null) {
        clearTimeout(postSpeechTimer)
      }
      speech.stop()
    }
  }, [narration])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center shadow-2xl border-4 border-emerald-400 max-h-[92dvh] flex flex-col items-center justify-center overflow-hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-100 text-emerald-600 mb-3 sm:mb-5 shadow-inner mx-auto shrink-0">
          <Sparkles className="w-10 h-10 sm:w-14 sm:h-14 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-emerald-950 mb-2 sm:mb-4 shrink-0">
          {content.title}
        </h2>

        <p className="text-lg sm:text-3xl text-stone-800 font-bold leading-snug sm:leading-relaxed shrink-0">
          {content.message}
        </p>
      </div>
    </div>
  )
}
