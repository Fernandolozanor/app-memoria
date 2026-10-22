import { useState, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, SWEET_PIANO_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface PianoKey {
  id: number
  noteName: string
  label: string
  freq: number
  color: string
  activeColor: string
}

const ALL_PIANO_KEYS: PianoKey[] = [
  {
    id: 0,
    noteName: 'DO',
    label: 'Rojo',
    freq: 261.63,
    color: 'bg-rose-500 border-rose-600 text-white',
    activeColor: 'bg-rose-300 ring-8 ring-rose-300 scale-105',
  },
  {
    id: 1,
    noteName: 'MI',
    label: 'Amarillo',
    freq: 329.63,
    color: 'bg-amber-400 border-amber-500 text-amber-950',
    activeColor: 'bg-amber-200 ring-8 ring-amber-300 scale-105',
  },
  {
    id: 2,
    noteName: 'SOL',
    label: 'Azul',
    freq: 392.0,
    color: 'bg-sky-500 border-sky-600 text-white',
    activeColor: 'bg-sky-300 ring-8 ring-sky-300 scale-105',
  },
  {
    id: 3,
    noteName: 'SI',
    label: 'Verde',
    freq: 493.88,
    color: 'bg-emerald-600 border-emerald-700 text-white',
    activeColor: 'bg-emerald-300 ring-8 ring-emerald-300 scale-105',
  },
]

export function SweetPiano({ onComplete, onExit }: Props) {
  const initialRoundParam = Number(new URLSearchParams(window.location.search).get('round'))
  const initialRound = initialRoundParam >= 1 && initialRoundParam <= 4 ? initialRoundParam : 1
  const [currentRound, setCurrentRound] = useState(initialRound) // 1 to 4
  const [_sequence, setSequence] = useState<number[]>([])
  const [_userStep, setUserStep] = useState(0)
  const [activeKey, setActiveKey] = useState<number | null>(null)
  const [isPlayingSeq, setIsPlayingSeq] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // Critical refs to eliminate state race conditions and stale closures
  const sequenceRef = useRef<number[]>([])
  const userStepRef = useRef(0)
  const isInputLockedRef = useRef(true) // Locked during playback and right after winning
  const roundAdvanceTimerRef = useRef<number | null>(null)
  const retryTimerRef = useRef<number | null>(null)

  const playNotesAfterVoice = async (seq: number[]) => {
    // 350ms pause after voice finishes speaking
    await new Promise((r) => setTimeout(r, 350))

    for (const keyId of seq) {
      setActiveKey(keyId)
      sound.playNote(ALL_PIANO_KEYS[keyId].freq, 0.45)
      await new Promise((r) => setTimeout(r, 650))
      setActiveKey(null)
      await new Promise((r) => setTimeout(r, 220))
    }

    // Finished playing notes: now unlock keys for user input
    userStepRef.current = 0
    setUserStep(0)
    isInputLockedRef.current = false
    setIsPlayingSeq(false)
    setFeedback('¡Te toca!')
    const turnVoice = pickRandom(SWEET_PIANO_VOICES.turn)
    speech.speak(turnVoice)
  }

  const playSequence = (seq: number[], announceRound = true) => {
    isInputLockedRef.current = true
    setIsPlayingSeq(true)
    setFeedback('Escucha las notas...')

    let started = false
    const triggerNotes = () => {
      if (started) return
      started = true
      playNotesAfterVoice(seq)
    }

    if (!announceRound) {
      // Replay without repeating the round announcement
      triggerNotes()
      return
    }

    const noteCountText = seq.length === 1 ? '1 nota' : `${seq.length} notas`
    const introText =
      seq.length === 4
        ? 'Ronda 4. ¡Aparece la tecla verde! Escucha las 4 notas.'
        : `Ronda ${seq.length}. Escucha ${noteCountText}.`

    const introDuration = speech.estimateDurationMs(introText)
    speech.speak(introText, () => {
      triggerNotes()
    })

    // Safety fallback adapted to intro speech duration
    setTimeout(() => {
      triggerNotes()
    }, introDuration + 2000)
  }

  const startRound = (roundNum: number) => {
    if (roundAdvanceTimerRef.current) clearTimeout(roundAdvanceTimerRef.current)

    let newSeq: number[] = []
    if (roundNum === 4) {
      // In the 4th (last) round: use all 4 keys (0: DO Rojo, 1: MI Amarillo, 2: SOL Azul, 3: SI Verde) in randomized order
      const allKeys = [0, 1, 2, 3]
      for (let i = allKeys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allKeys[i], allKeys[j]] = [allKeys[j], allKeys[i]]
      }
      newSeq = allKeys
    } else {
      for (let i = 0; i < roundNum; i++) {
        newSeq.push(Math.floor(Math.random() * 3))
      }
    }

    sequenceRef.current = newSeq
    setSequence(newSeq)
    userStepRef.current = 0
    setUserStep(0)
    setFeedback('')
    setIsSuccess(false)
    isInputLockedRef.current = true

    setTimeout(() => {
      playSequence(newSeq, true)
    }, 350)
  }

  useEffect(() => {
    startRound(currentRound)
    return () => {
      if (roundAdvanceTimerRef.current) clearTimeout(roundAdvanceTimerRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      speech.stop()
    }
  }, [currentRound])

  const handleKeyPress = (keyId: number) => {
    // Guard against any input while sequence is playing or during round advance
    if (isInputLockedRef.current || isPlayingSeq) return

    sound.playNote(ALL_PIANO_KEYS[keyId].freq, 0.4)
    setActiveKey(keyId)
    setTimeout(() => setActiveKey(null), 250)

    const expectedKey = sequenceRef.current[userStepRef.current]

    if (keyId === expectedKey) {
      // Correct note tapped! Advance synchronous ref immediately
      userStepRef.current += 1
      setUserStep(userStepRef.current)

      // Check if complete sequence was successfully reproduced
      if (userStepRef.current >= sequenceRef.current.length) {
        // LOCK INPUT IMMEDIATELY so accidental double taps cannot fail
        isInputLockedRef.current = true
        sound.playSuccess()
        setFeedback('¡Muy bien!')

        let hasAdv = false
        const advance = () => {
          if (hasAdv) return
          hasAdv = true
          if (roundAdvanceTimerRef.current) clearTimeout(roundAdvanceTimerRef.current)
          setTimeout(() => {
            if (currentRound < 4) {
              setCurrentRound((prev) => prev + 1)
            } else {
              setIsSuccess(true)
              onComplete()
            }
          }, 450)
        }

        const successVoice = pickRandom(SWEET_PIANO_VOICES.success)
        const successDuration = speech.estimateDurationMs(successVoice)
        speech.speak(successVoice, advance)
        roundAdvanceTimerRef.current = window.setTimeout(advance, successDuration + 2200)
      }
    } else {
      // Incorrect note tapped: lock input immediately and let the speech finish completely
      isInputLockedRef.current = true
      sound.playGentleRetry()
      setFeedback('Esa no era. Escucha otra vez.')
      userStepRef.current = 0
      setUserStep(0)

      let hasTriggered = false
      const triggerReplay = () => {
        if (hasTriggered) return
        hasTriggered = true
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current)
          retryTimerRef.current = null
        }
        // Small breathing pause of 350ms after speech ends before playing melody
        setTimeout(() => {
          playSequence(sequenceRef.current, false)
        }, 350)
      }

      // Speak varied correction softly and ONLY restart once voice finishes speaking without re-announcing round
      const retryVoice = pickRandom(SWEET_PIANO_VOICES.gentleRetry)
      const retryDuration = speech.estimateDurationMs(retryVoice)
      speech.speak(retryVoice, () => {
        triggerReplay()
      })

      // Fallback timer if onEnd callback is delayed or unsupported
      retryTimerRef.current = window.setTimeout(() => {
        triggerReplay()
      }, retryDuration + 2000)
    }
  }

  const handleRepeat = () => {
    if (isInputLockedRef.current && isPlayingSeq) return
    userStepRef.current = 0
    setUserStep(0)
    playSequence(sequenceRef.current, false)
  }

  const visibleKeys = currentRound === 4 ? ALL_PIANO_KEYS : ALL_PIANO_KEYS.slice(0, 3)

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl mx-auto overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center justify-center bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 sm:border-3 border-violet-300 mb-1.5 sm:mb-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Ronda:</span>
          <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-violet-100 text-violet-950 font-black rounded-xl sm:rounded-2xl text-base sm:text-2xl">
            {currentRound} de 4 ({currentRound} {currentRound === 1 ? 'nota' : 'notas'})
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-violet-400 rounded-2xl sm:rounded-3xl p-2.5 sm:p-8 shadow-md text-center min-h-0 overflow-hidden">
        <div className="shrink-0">
          <h3 className="text-xl sm:text-3xl font-black text-violet-950 mb-0.5 sm:mb-2">
            El Piano de Colores
          </h3>
          <p className="text-sm sm:text-xl font-bold text-stone-700">
            {isPlayingSeq ? 'Escuchando notas...' : 'Toca las notas que han sonado:'}
          </p>
        </div>

        {/* Stable container: keeps fixed height so keys never shift position */}
        <div className="min-h-[42px] sm:min-h-[64px] flex items-center justify-center my-1 sm:my-2 shrink-0">
          <div
            className={`w-full p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-violet-100 border-2 sm:border-3 border-violet-400 text-violet-950 font-black text-sm sm:text-xl transition-opacity duration-200 ${
              feedback ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {feedback || 'Espacio reservado'}
          </div>
        </div>

        {/* Piano Keys: 3 keys in rounds 1-3, 4 keys in round 4 (including green SI key) */}
        <div
          style={{
            gridTemplateColumns: currentRound === 4 ? 'repeat(4, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
          }}
          className="grid gap-2 sm:gap-6 w-full max-w-xl mx-auto flex-1 min-h-0 my-auto items-stretch"
        >
          {visibleKeys.map((k) => {
            const isLit = activeKey === k.id
            return (
              <button
                key={k.id}
                disabled={isPlayingSeq}
                onClick={() => handleKeyPress(k.id)}
                className={`min-w-0 w-full h-full min-h-[110px] sm:min-h-[180px] max-h-[200px] sm:max-h-[280px] rounded-xl sm:rounded-3xl border-2 sm:border-4 transition-all duration-150 flex flex-col items-center justify-between py-3 sm:py-6 px-1 sm:px-2 cursor-pointer shadow-sm sm:shadow-lg active:scale-95 ${
                  isLit ? k.activeColor : `${k.color} opacity-95 hover:opacity-100`
                }`}
                aria-label={`Tecla ${k.noteName} ${k.label}`}
              >
                <span className="text-3xl sm:text-6xl font-black tracking-normal">
                  {k.noteName}
                </span>
                <span className="font-black text-sm sm:text-2xl uppercase tracking-normal px-0.5 text-center leading-none w-full">
                  {k.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex justify-center mt-2 sm:mt-4 shrink-0">
          <button
            onClick={handleRepeat}
            disabled={isPlayingSeq}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-3 bg-violet-50 hover:bg-violet-100 text-violet-950 font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl border-2 border-violet-300 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
            title="Repetir melodía"
            aria-label="Repetir melodía"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-violet-700" />
            <span>Volver a escuchar las notas</span>
          </button>
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has superado las 4 rondas del piano sumando todas las notas."
          onRestart={() => {
            setCurrentRound(1)
            startRound(1)
          }}
          onHome={onExit}
        />
      )}
    </div>
  )
}
