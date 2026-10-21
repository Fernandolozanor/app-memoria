import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { speech } from '../services/speech'

interface Props {
  text: string
  className?: string
  label?: string
}

export function SpeakerButton({ text, className = '', label = 'Escuchar' }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handleSpeak = () => {
    if (isPlaying) {
      speech.stop()
      setIsPlaying(false)
      return
    }

    setIsPlaying(true)
    speech.speak(text, () => {
      setIsPlaying(false)
    })
  }

  return (
    <button
      onClick={handleSpeak}
      className={`inline-flex items-center justify-center gap-1.5 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-2xl shadow-sm sm:shadow-md border-2 sm:border-3 transition-all active:scale-95 cursor-pointer min-h-[42px] sm:min-h-[58px] ${
        isPlaying
          ? 'bg-blue-200 text-blue-950 border-blue-400 ring-4 ring-blue-300 animate-pulse'
          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
      } ${className}`}
      title="Leer las instrucciones en voz alta"
      aria-label="Leer en voz alta"
    >
      {isPlaying ? (
        <VolumeX className="w-5 h-5 sm:w-8 sm:h-8 text-blue-950 stroke-[2.5]" />
      ) : (
        <Volume2 className="w-5 h-5 sm:w-8 sm:h-8 text-white stroke-[2.5]" />
      )}
      <span>{isPlaying ? 'Detener voz' : label}</span>
    </button>
  )
}
