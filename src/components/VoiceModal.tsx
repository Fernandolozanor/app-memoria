import { useState, useEffect } from 'react'
import { Volume2, Check, X } from 'lucide-react'
import { speech, type VoiceProfile } from '../services/speech'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function VoiceModal({ isOpen, onClose }: Props) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [testingProfileId, setTestingProfileId] = useState<string | null>(null)

  useEffect(() => {
    const updateVoices = () => {
      const avail = speech.getAvailableVoiceProfiles()
      setProfiles(avail)
      const current = speech.getCurrentProfile()
      if (current) {
        setSelectedProfileId(current.id)
      }
    }

    updateVoices()
    const unsubscribe = speech.subscribe(updateVoices)
    return () => unsubscribe()
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = (p: VoiceProfile) => {
    speech.setProfileById(p.id)
    setSelectedProfileId(p.id)
  }

  const handleTestVoice = (p: VoiceProfile) => {
    setTestingProfileId(p.id)
    speech.speak(
      'Hola. Con esta voz leeré las instrucciones y te acompañaré en cada juego. ¿Te gusta cómo suena?',
      () => {
        setTestingProfileId(null)
      },
      p
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-4 sm:p-7 max-w-lg w-full shadow-2xl border-4 border-emerald-400 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-stone-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-stone-950">Elegir voz</h2>
              <p className="text-xs sm:text-base font-bold text-stone-600">
                Elige la voz que te resulte más agradable y clara:
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              speech.stop()
              onClose()
            }}
            className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Voices List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-0">
          {profiles.length === 0 ? (
            <div className="p-4 text-center text-stone-600 font-bold">
              Cargando las voces de tu dispositivo...
            </div>
          ) : (
            profiles.map((p) => {
              const isSelected = p.id === selectedProfileId
              const isTesting = p.id === testingProfileId

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`p-3 sm:p-4 rounded-2xl border-3 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-300'
                      : 'bg-stone-50 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base sm:text-xl text-stone-950">
                        {p.title}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] sm:text-xs font-bold shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" /> Activa
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-stone-600 mt-0.5">
                      {p.tag}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTestVoice(p)
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shrink-0 border-2 ${
                      isTesting
                        ? 'bg-blue-200 text-blue-950 border-blue-400 ring-2 ring-blue-300 animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs active:scale-95'
                    }`}
                    title="Escuchar cómo suena esta voz"
                  >
                    <Volume2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{isTesting ? 'Sonando...' : 'Escuchar'}</span>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info & close button */}
        <div className="pt-3 border-t-2 border-stone-200 shrink-0">
          <button
            onClick={() => {
              speech.stop()
              onClose()
            }}
            className="w-full py-3 sm:py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-xl rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Guardar y aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
