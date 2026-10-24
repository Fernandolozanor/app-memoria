import { useState, useEffect, useRef } from 'react'
import { Phone, Eye } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_PRAISES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface ContactInfo {
  name: string
  emoji: string
}

// 24 contactos cotidianos variados
const CONTACTS: ContactInfo[] = [
  { name: 'La Panadería del barrio', emoji: '🥖' },
  { name: 'Tu nieto Carlos', emoji: '👦' },
  { name: 'La Farmacia de guardia', emoji: '💊' },
  { name: 'Tu sobrina María', emoji: '👩' },
  { name: 'El Centro de Salud', emoji: '🏥' },
  { name: 'La Frutería de la esquina', emoji: '🍎' },
  { name: 'Radio Taxi', emoji: '🚕' },
  { name: 'La Peluquería', emoji: '💇' },
  { name: 'Tu hija Laura', emoji: '👩' },
  { name: 'Tu hijo Antonio', emoji: '👨' },
  { name: 'Tu nieta Lucía', emoji: '👧' },
  { name: 'La Pescadería', emoji: '🐟' },
  { name: 'La Floristería', emoji: '💐' },
  { name: 'El Taller del coche', emoji: '🔧' },
  { name: 'Tu vecino Pepe', emoji: '👴' },
  { name: 'Tu vecina Carmen', emoji: '👵' },
  { name: 'La Pastelería', emoji: '🍰' },
  { name: 'La Óptica', emoji: '👓' },
  { name: 'El Ayuntamiento', emoji: '🏛️' },
  { name: 'Tu primo Paco', emoji: '👨' },
  { name: 'Tu prima Rosa', emoji: '👩' },
  { name: 'El Dentista', emoji: '🏥' },
  { name: 'El Quiosco de prensa', emoji: '📰' },
  { name: 'La Cafetería de la plaza', emoji: '☕' },
]

const MEMORIZE_VOICES = [
  (name: string, len: number, digits: string) =>
    `Vamos a llamar a ${name}. Recuerda este número de ${len} cifras: ${digits}. Pulsa el botón verde cuando estés listo.`,
  (name: string, len: number, digits: string) =>
    `Toca telefonear a ${name}. Memoriza sus ${len} números en orden: ${digits}. Dale al botón verde cuando te lo sepas.`,
  (name: string, len: number, digits: string) =>
    `Llamada para ${name}. Fíjate bien en las ${len} cifras: ${digits}. Pulsa el botón cuando las tengas en mente.`,
]

const DIAL_VOICES = [
  (len: number) => `Marca en orden las ${len} cifras del teléfono.`,
  (len: number) => `Ahora pulsa los ${len} números en el teclado en el mismo orden.`,
  (len: number) => `¿Te acuerdas del número? Marca las ${len} cifras una por una.`,
]

const ROUND_LENGTHS = [3, 4, 5, 6]

function generatePhoneDigits(len: number): number[] {
  const first = [6, 9][Math.floor(Math.random() * 2)]
  const digits = [first]
  for (let i = 1; i < len; i++) {
    digits.push(Math.floor(Math.random() * 10))
  }
  return digits
}

export function HomePhone({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<'memorize' | 'dial'>('memorize')
  const [sessionContacts, setSessionContacts] = useState<ContactInfo[]>(() =>
    [...CONTACTS].sort(() => 0.5 - Math.random()).slice(0, 4)
  )
  const [targetDigits, setTargetDigits] = useState<number[]>([9, 1, 5])
  const [dialedDigits, setDialedDigits] = useState<number[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const contact = sessionContacts[roundIdx] || CONTACTS[0]

  const setupRound = (rIdx: number, contactsPool = sessionContacts) => {
    isAdvancingRef.current = false
    const len = ROUND_LENGTHS[rIdx] || 3
    const digits = generatePhoneDigits(len)
    const pickedContact = contactsPool[rIdx] || CONTACTS[0]

    setTargetDigits(digits)
    setDialedDigits([])
    setFeedback('')
    setPhase('memorize')

    const spokenDigits = digits.join(', ')
    const timer = setTimeout(() => {
      const voiceFn = pickRandom(MEMORIZE_VOICES)
      speech.speak(voiceFn(pickedContact.name, len, spokenDigits))
    }, 250)

    return () => clearTimeout(timer)
  }

  useEffect(() => {
    const cleanup = setupRound(roundIdx)
    return () => {
      cleanup()
      speech.stop()
    }
  }, [roundIdx, sessionContacts])

  const handleStartDialing = () => {
    sound.playTap()
    setPhase('dial')
    setFeedback('')
    const dialFn = pickRandom(DIAL_VOICES)
    speech.speak(dialFn(targetDigits.length))
  }

  const handlePeekNumber = () => {
    sound.playTap()
    setPhase('memorize')
    const spokenDigits = targetDigits.join(', ')
    speech.speak(`Aquí tienes el número otra vez: ${spokenDigits}.`)
  }

  const handlePressDigit = (digit: number) => {
    if (isAdvancingRef.current) return
    const nextIdx = dialedDigits.length
    if (nextIdx >= targetDigits.length) return

    sound.playPhoneDtmf(digit)

    const expected = targetDigits[nextIdx]
    if (digit === expected) {
      const nextDialed = [...dialedDigits, digit]
      setDialedDigits(nextDialed)
      setFeedback('')

      if (nextDialed.length === targetDigits.length) {
        isAdvancingRef.current = true
        setTimeout(() => sound.playSuccess(), 220)
        const praise = pickRandom(GENERAL_PRAISES)
        setFeedback(`📞 ¡Llamando a ${contact.name}! ${praise}`)

        let hasAdv = false
        const advance = () => {
          if (hasAdv) return
          hasAdv = true
          setTimeout(() => {
            if (roundIdx + 1 < ROUND_LENGTHS.length) {
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
      }
    } else {
      setTimeout(() => sound.playGentleRetry(), 160)
      setFeedback(`Esa cifra no toca ahora. Prueba otra o pulsa "Ver".`)
      speech.speak('Esa no era la cifra siguiente. Prueba con otra o mira el número de nuevo.')
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-emerald-400 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-5xl sm:text-7xl leading-none shrink-0">{contact.emoji}</span>
            <div className="text-left min-w-0">
              <h3 className="text-2xl sm:text-4xl font-black text-stone-950 leading-none">
                {contact.name}
              </h3>
              <p className="text-base sm:text-2xl font-bold text-emerald-800 mt-0.5">
                Teléfono de {targetDigits.length} cifras
              </p>
            </div>
          </div>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-emerald-100 border-2 sm:border-3 border-emerald-400 text-emerald-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            {roundIdx + 1}/4
          </span>
        </div>

        {phase === 'memorize' ? (
          <div className="flex-1 flex flex-col justify-between min-h-0 gap-3 py-2">
            <p className="text-2xl sm:text-4xl font-black text-stone-800 shrink-0">
              Memoriza este número en orden:
            </p>

            {/* Giant Phone Number Display — ALWAYS on a single line (flex-nowrap) */}
            <div className="flex-1 min-h-0 flex items-center justify-center bg-emerald-50 border-4 border-emerald-400 rounded-3xl p-2 sm:p-5 overflow-hidden">
              <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-3 md:gap-4 w-full max-w-3xl">
                {targetDigits.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex-1 max-w-28 h-24 sm:h-32 md:h-36 min-w-0 bg-white border-3 sm:border-4 border-emerald-600 rounded-2xl sm:rounded-3xl shadow-md flex items-center justify-center"
                  >
                    <span className="text-5xl sm:text-7xl md:text-8xl font-black text-stone-950 leading-none">
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartDialing}
              className="w-full py-4 sm:py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl sm:rounded-3xl font-black text-2xl sm:text-4xl shadow-md border-3 border-emerald-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3 shrink-0 animate-start-pulse"
            >
              <Phone className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
              <span>¡Me lo sé! Ir al teclado →</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between min-h-0 gap-2">
            {/* Dialed Screen + Peek Button (always single line) */}
            <div className="flex items-center justify-between gap-2 bg-stone-100 border-3 border-stone-300 rounded-2xl p-2 sm:p-3 shrink-0">
              <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-2.5 flex-1 min-w-0">
                {targetDigits.map((_, idx) => {
                  const entered = dialedDigits[idx]
                  const isCurrent = idx === dialedDigits.length
                  return (
                    <div
                      key={idx}
                      className={`flex-1 max-w-16 h-12 sm:h-16 min-w-0 rounded-xl sm:rounded-2xl border-3 flex items-center justify-center font-black text-2xl sm:text-4xl ${
                        entered !== undefined
                          ? 'bg-emerald-600 border-emerald-700 text-white'
                          : isCurrent
                          ? 'bg-amber-100 border-amber-500 text-amber-900 animate-pulse'
                          : 'bg-white border-stone-300 text-stone-300'
                      }`}
                    >
                      {entered !== undefined ? entered : '•'}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={handlePeekNumber}
                className="px-3 sm:px-4 py-2 bg-amber-200 hover:bg-amber-300 border-2 border-amber-400 text-amber-950 font-black rounded-xl text-base sm:text-2xl flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Eye className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
                <span>Ver</span>
              </button>
            </div>

            {feedback && (
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-base sm:text-2xl shrink-0">
                {feedback}
              </div>
            )}

            {/* Giant Numeric Keypad */}
            <div className="grid grid-cols-5 grid-rows-2 gap-2 sm:gap-3 flex-1 min-h-0 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePressDigit(num)}
                  className="w-full h-full min-h-0 bg-stone-50 hover:bg-emerald-50 active:bg-emerald-200 border-3 sm:border-4 border-stone-300 hover:border-emerald-500 rounded-2xl sm:rounded-3xl shadow-sm flex items-center justify-center font-black text-4xl sm:text-6xl md:text-7xl text-stone-950 cursor-pointer transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Llamada completada!"
          message="Has recordado y marcado todos los números de teléfono de 3 a 6 cifras."
          onRestart={() => {
            const fresh = [...CONTACTS].sort(() => 0.5 - Math.random()).slice(0, 4)
            setSessionContacts(fresh)
            setIsSuccess(false)
            setRoundIdx(0)
          }}
          onHome={onExit}
        />
      )}
    </div>
  )
}
