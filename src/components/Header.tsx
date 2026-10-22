import { ArrowLeft } from 'lucide-react'

interface Props {
  title?: string
  subtitle?: string
  onBack?: () => void
}

export function Header({
  title,
  subtitle,
  onBack,
}: Props) {
  if (!onBack && !title) return null

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b-2 sm:border-b-3 border-stone-300 px-2 sm:px-6 py-1 sm:py-2.5 shadow-xs shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl sm:rounded-2xl font-black text-base sm:text-xl border-2 sm:border-3 border-red-700 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 min-h-[40px] sm:min-h-[54px]"
              aria-label="Volver al menú principal"
            >
              <ArrowLeft className="w-5 h-5 sm:w-7 sm:h-7 text-white stroke-[3]" />
              <span>Volver</span>
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
      </div>
    </header>
  )
}
