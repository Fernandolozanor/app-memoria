import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Sparkles, RotateCcw, Home } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SpeakerButton } from './SpeakerButton'

interface Props {
  title?: string
  message?: string
  onRestart: () => void
  onHome: () => void
}

export function SuccessCelebration({
  title = '¡Excelente trabajo!',
  message = 'Has completado esta actividad.',
  onRestart,
  onHome,
}: Props) {
  const narration = `${title}. ${message}`

  useEffect(() => {
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

    // Automatically speak the celebration right as the fun victory melody finishes (~2.3s)
    const timer = setTimeout(() => {
      speech.speak(narration)
    }, 2300)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [narration])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-lg w-full text-center shadow-2xl border-4 border-emerald-400 max-h-[92dvh] flex flex-col justify-between overflow-hidden">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 mb-2 sm:mb-4 shadow-inner mx-auto shrink-0">
          <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-emerald-950 mb-1.5 sm:mb-3 shrink-0">
          {title}
        </h2>

        <p className="text-base sm:text-3xl text-stone-800 font-bold mb-3 sm:mb-6 leading-snug sm:leading-relaxed shrink-0">
          {message}
        </p>

        <div className="flex justify-center mb-3 sm:mb-6 shrink-0">
          <SpeakerButton text={narration} label="Repetir voz" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 shrink-0">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-5 px-3 sm:px-6 text-base sm:text-2xl font-black rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 border-2 sm:border-3 border-stone-300 transition-all active:scale-95 cursor-pointer min-h-[50px] sm:min-h-[68px]"
          >
            <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7 text-stone-700 stroke-[2.5]" />
            <span>Repetir</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-5 px-3 sm:px-6 text-base sm:text-2xl font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md sm:shadow-lg border-2 sm:border-3 border-emerald-700 transition-all active:scale-95 cursor-pointer min-h-[50px] sm:min-h-[68px]"
          >
            <Home className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
            <span>Menú</span>
          </button>
        </div>
      </div>
    </div>
  )
}
