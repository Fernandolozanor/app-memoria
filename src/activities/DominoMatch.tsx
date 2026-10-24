import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_PRAISES, GENERAL_RETRIES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface DominoTile {
  id: string
  a: number // 0..6
  b: number // 0..6
}

// Full 28-tile classic Domino set (0-0 to 6-6)
const FULL_DOMINO_SET: DominoTile[] = []
for (let i = 0; i <= 6; i++) {
  for (let j = i; j <= 6; j++) {
    FULL_DOMINO_SET.push({ id: `dom-${i}-${j}`, a: i, b: j })
  }
}

const PIP_POSITIONS: Record<number, [number, number][]> = {
  0: [],
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 1],
    [0, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
}

function DominoFaceHalf({ value }: { value: number }) {
  const pips = PIP_POSITIONS[value] || []
  return (
    <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 grid grid-cols-3 grid-rows-3 p-2 sm:p-3 place-items-center">
      {Array.from({ length: 9 }, (_, idx) => {
        const r = Math.floor(idx / 3)
        const c = idx % 3
        const hasPip = pips.some(([pr, pc]) => pr === r && pc === c)
        return (
          <div
            key={idx}
            className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full ${
              hasPip ? 'bg-stone-950 shadow-xs' : 'bg-transparent'
            }`}
          />
        )
      })}
    </div>
  )
}

function DominoVisual({ tile }: { tile: DominoTile }) {
  return (
    <div className="inline-flex flex-row items-center bg-[#FFFDF7] border-4 border-stone-900 rounded-2xl shadow-md overflow-hidden">
      <DominoFaceHalf value={tile.a} />
      <div className="w-1.5 sm:w-2 h-14 sm:h-20 bg-stone-900 rounded-full" />
      <DominoFaceHalf value={tile.b} />
    </div>
  )
}

export function DominoMatch({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [promptText, setPromptText] = useState('')
  const [subText, setSubText] = useState('')
  const [options, setOptions] = useState<DominoTile[]>([])
  const [winningIds, setWinningIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  // Dynamically generates random domino challenges from the full 28-tile set
  const setupRound = (rIdx: number) => {
    isAdvancingRef.current = false
    setSelectedIds([])
    setFeedback('')

    const shuffledDeck = [...FULL_DOMINO_SET].sort(() => 0.5 - Math.random())

    if (rIdx === 0) {
      // Round 1: Find the tile that contains a specific number (1..6) among 3 tiles
      const targetNum = Math.floor(Math.random() * 6) + 1
      const winner = shuffledDeck.find((t) => t.a === targetNum || t.b === targetNum)!
      const others = shuffledDeck
        .filter((t) => t.a !== targetNum && t.b !== targetNum)
        .slice(0, 2)

      setOptions([winner, ...others].sort(() => 0.5 - Math.random()))
      setWinningIds([winner.id])
      setPromptText(`Ficha con el número ${targetNum}`)
      setSubText(`Toca la ficha que tiene ${targetNum} puntos en uno de sus lados`)
      setTimeout(() => {
        speech.speak(
          `Ronda 1. Para seguir la partida, toca la ficha que tiene ${targetNum} puntos en un lado.`
        )
      }, 250)
    } else if (rIdx === 1) {
      // Round 2: Find the tile whose two halves sum to targetSum (4, 5, 6, or 7) among 4 tiles
      const targetSum = [4, 5, 6, 7][Math.floor(Math.random() * 4)]
      const winner = shuffledDeck.find((t) => t.a + t.b === targetSum)!
      const others = shuffledDeck.filter((t) => t.a + t.b !== targetSum).slice(0, 3)

      setOptions([winner, ...others].sort(() => 0.5 - Math.random()))
      setWinningIds([winner.id])
      setPromptText(`Suma total: ${targetSum} puntos`)
      setSubText(`Toca la ficha cuyos puntos suman ${targetSum} en total`)
      setTimeout(() => {
        speech.speak(
          `Ronda 2. Cuenta los puntos y toca la ficha que suma exactamente ${targetSum} puntos.`
        )
      }, 250)
    } else if (rIdx === 2) {
      // Round 3: Find the tile whose two halves sum to a higher targetSum (8, 9, 10, or 11) among 6 tiles
      const targetSum = [8, 9, 10, 11][Math.floor(Math.random() * 4)]
      const winner = shuffledDeck.find((t) => t.a + t.b === targetSum)!
      const others = shuffledDeck.filter((t) => t.a + t.b !== targetSum).slice(0, 5)

      setOptions([winner, ...others].sort(() => 0.5 - Math.random()))
      setWinningIds([winner.id])
      setPromptText(`Suma total: ${targetSum} puntos`)
      setSubText(`Toca la ficha cuyos puntos suman ${targetSum} en total`)
      setTimeout(() => {
        speech.speak(
          `Ronda 3. Busca entre las 6 fichas la que suma exactamente ${targetSum} puntos.`
        )
      }, 250)
    } else {
      // Round 4: Pick the 2 tiles that each sum to targetEach (4, 5, 6, or 7) among 6 tiles
      const targetEach = [4, 5, 6, 7][Math.floor(Math.random() * 4)]
      const winners = shuffledDeck.filter((t) => t.a + t.b === targetEach).slice(0, 2)
      const others = shuffledDeck.filter((t) => t.a + t.b !== targetEach).slice(0, 4)

      setOptions([...winners, ...others].sort(() => 0.5 - Math.random()))
      setWinningIds(winners.map((w) => w.id))
      setPromptText(`2 fichas de ${targetEach} puntos`)
      setSubText(
        `Toca las 2 fichas que suman ${targetEach} puntos cada una (juntas suman ${targetEach * 2})`
      )
      setTimeout(() => {
        speech.speak(
          `Última ronda. Toca las 2 fichas que tienen ${targetEach} puntos cada una, para juntar ${
            targetEach * 2
          } puntos.`
        )
      }, 250)
    }
  }

  useEffect(() => {
    setupRound(roundIdx)
    return () => speech.stop()
  }, [roundIdx])

  const handleSelectTile = (tile: DominoTile) => {
    if (isAdvancingRef.current || selectedIds.includes(tile.id)) return
    sound.playTap()

    if (winningIds.includes(tile.id)) {
      sound.playSuccess()
      const next = [...selectedIds, tile.id]
      setSelectedIds(next)

      if (next.length === winningIds.length) {
        isAdvancingRef.current = true
        const praise = pickRandom(GENERAL_PRAISES)
        setFeedback(`🁢 ¡Jugada maestra! (${tile.a} + ${tile.b} = ${tile.a + tile.b})`)

        let hasAdv = false
        const advance = () => {
          if (hasAdv) return
          hasAdv = true
          setTimeout(() => {
            if (roundIdx + 1 < 4) {
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
        setFeedback('¡Bien! Ya tienes la primera ficha. Busca la segunda.')
        speech.speak('¡Muy bien! Ahora toca la segunda ficha.')
      }
    } else {
      sound.playGentleRetry()
      const sum = tile.a + tile.b
      setFeedback(`Esa ficha tiene ${tile.a} y ${tile.b} (suman ${sum}). Prueba otra.`)
      speech.speak(pickRandom(GENERAL_RETRIES))
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-teal-500 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-4xl sm:text-6xl leading-none shrink-0">🁢</span>
            <div className="text-left min-w-0">
              <h3 className="text-2xl sm:text-4xl font-black text-stone-950 leading-none">
                {promptText}
              </h3>
              <p className="text-base sm:text-2xl font-bold text-teal-900 mt-0.5">{subText}</p>
            </div>
          </div>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-teal-100 border-2 sm:border-3 border-teal-400 text-teal-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            {roundIdx + 1}/4
          </span>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-base sm:text-2xl shrink-0">
            {feedback}
          </div>
        )}

        {/* Green Felt Domino Board */}
        <div
          className={`flex-1 min-h-0 w-full bg-emerald-900 border-4 border-amber-900 rounded-2xl sm:rounded-3xl p-2 sm:p-4 grid gap-2 sm:gap-4 items-stretch ${
            options.length === 3
              ? 'grid-cols-1 grid-rows-3'
              : options.length === 4
              ? 'grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2'
              : 'grid-cols-1 sm:grid-cols-2 grid-rows-6 sm:grid-rows-3'
          }`}
        >
          {options.map((tile) => {
            const isPicked = selectedIds.includes(tile.id)
            return (
              <button
                key={tile.id}
                disabled={isPicked}
                onClick={() => handleSelectTile(tile)}
                className={`relative w-full h-full min-h-0 rounded-2xl border-3 flex items-center justify-center gap-3 p-1.5 cursor-pointer transition-all active:scale-95 ${
                  isPicked
                    ? 'bg-emerald-500/30 border-emerald-300 ring-4 ring-emerald-300'
                    : 'bg-emerald-800/70 hover:bg-emerald-700/80 border-emerald-600'
                }`}
                aria-label={`Ficha de dominó ${tile.a} y ${tile.b}`}
              >
                {isPicked && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
                    <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
                  </div>
                )}
                <DominoVisual tile={tile} />
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Maestro del Dominó!"
          message="Has contado y emparejado todas las fichas de dominó como un auténtico campeón."
          onRestart={() => {
            setIsSuccess(false)
            setRoundIdx(0)
            setupRound(0)
          }}
          onHome={onExit}
        />
      )}
    </div>
  )
}
