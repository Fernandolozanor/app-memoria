import { ArrowLeft, Star, Volume2 } from 'lucide-react'

interface Props {
  title?: string
  subtitle?: string
  onBack?: () => void
  stars: number
  onOpenVoiceModal?: () => void
}

export function Header({
  title,
  subtitle,
  onBack,
  stars,
  onOpenVoiceModal,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b-2 sm:border-b-3 border-stone-300 px-2 sm:px-6 py-1 sm:py-2.5 shadow-xs shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl border-2 sm:border-3 border-stone-400 transition-all active:scale-95 cursor-pointer shrink-0 min-h-[40px] sm:min-h-[54px]"
              aria-label="Volver al menú principal"
            >
              <ArrowLeft className="w-5 h-5 sm:w-7 sm:h-7 text-stone-900 stroke-[3]" />
              <span>Menú</span>
            </button>
          )}

          {title && (
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-3xl md:text-4xl font-black text-stone-950 tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-lg sm:text-xl font-bold text-stone-700 leading-snug truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right side controls: Voice picker & Stars */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base border-2 border-blue-200 hover:border-blue-300 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
              title="Elegir voz de la narradora"
              aria-label="Elegir voz de la narradora"
            >
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700 stroke-[2.5]" />
              <span>Voz</span>
            </button>
          )}

          {/* Stars badge */}
          <div className="flex items-center gap-1 sm:gap-2 bg-amber-100 border-2 sm:border-3 border-amber-400 text-amber-950 px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl font-black text-sm sm:text-2xl shadow-xs">
            <Star className="w-4 h-4 sm:w-7 sm:h-7 fill-amber-400 text-amber-600 stroke-[2.5]" />
            <span>{stars}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
