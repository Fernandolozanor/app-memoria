import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_PRAISES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface WordEntry {
  word: string
  emoji: string
  syllables: string[]
  distractors: string[]
}

// 15 palabras de 2 sílabas (Ronda 1)
const ROUND_1_WORDS: WordEntry[] = [
  { word: 'CAFÉ', emoji: '☕', syllables: ['CA', 'FÉ'], distractors: [] },
  { word: 'PERA', emoji: '🍐', syllables: ['PE', 'RA'], distractors: [] },
  { word: 'SOFÁ', emoji: '🛋️', syllables: ['SO', 'FÁ'], distractors: [] },
  { word: 'QUESO', emoji: '🧀', syllables: ['QUE', 'SO'], distractors: [] },
  { word: 'GATO', emoji: '🐱', syllables: ['GA', 'TO'], distractors: [] },
  { word: 'PERRO', emoji: '🐶', syllables: ['PE', 'RRO'], distractors: [] },
  { word: 'CASA', emoji: '🏠', syllables: ['CA', 'SA'], distractors: [] },
  { word: 'LUNA', emoji: '🌙', syllables: ['LU', 'NA'], distractors: [] },
  { word: 'ROSA', emoji: '🌹', syllables: ['RO', 'SA'], distractors: [] },
  { word: 'VINO', emoji: '🍷', syllables: ['VI', 'NO'], distractors: [] },
  { word: 'CAMA', emoji: '🛏️', syllables: ['CA', 'MA'], distractors: [] },
  { word: 'UVAS', emoji: '🍇', syllables: ['U', 'VAS'], distractors: [] },
  { word: 'PIÑA', emoji: '🍍', syllables: ['PI', 'ÑA'], distractors: [] },
  { word: 'LLAVE', emoji: '🔑', syllables: ['LLA', 'VE'], distractors: [] },
  { word: 'LIBRO', emoji: '📖', syllables: ['LI', 'BRO'], distractors: [] },
]

// 15 palabras de 3 sílabas sin intrusos (Ronda 2)
const ROUND_2_WORDS: WordEntry[] = [
  { word: 'ZAPATO', emoji: '👞', syllables: ['ZA', 'PA', 'TO'], distractors: [] },
  { word: 'NARANJA', emoji: '🍊', syllables: ['NA', 'RAN', 'JA'], distractors: [] },
  { word: 'CAMPANA', emoji: '🔔', syllables: ['CAM', 'PA', 'NA'], distractors: [] },
  { word: 'MANZANA', emoji: '🍎', syllables: ['MAN', 'ZA', 'NA'], distractors: [] },
  { word: 'TOMATE', emoji: '🍅', syllables: ['TO', 'MA', 'TE'], distractors: [] },
  { word: 'CAMISA', emoji: '👔', syllables: ['CA', 'MI', 'SA'], distractors: [] },
  { word: 'VESTIDO', emoji: '👗', syllables: ['VES', 'TI', 'DO'], distractors: [] },
  { word: 'HELADO', emoji: '🍦', syllables: ['HE', 'LA', 'DO'], distractors: [] },
  { word: 'PESCADO', emoji: '🐟', syllables: ['PES', 'CA', 'DO'], distractors: [] },
  { word: 'CEREZAS', emoji: '🍒', syllables: ['CE', 'RE', 'ZAS'], distractors: [] },
  { word: 'MALETA', emoji: '🧳', syllables: ['MA', 'LE', 'TA'], distractors: [] },
  { word: 'GALLETA', emoji: '🍪', syllables: ['GA', 'LLE', 'TA'], distractors: [] },
  { word: 'PALOMA', emoji: '🐦', syllables: ['PA', 'LO', 'MA'], distractors: [] },
  { word: 'CORONA', emoji: '👑', syllables: ['CO', 'RO', 'NA'], distractors: [] },
  { word: 'BOTELLA', emoji: '🍼', syllables: ['BO', 'TE', 'LLA'], distractors: [] },
]

// 14 palabras de 3 sílabas con 1 sílaba trampa (Ronda 3)
const ROUND_3_WORDS: WordEntry[] = [
  { word: 'PARAGUAS', emoji: '☂️', syllables: ['PA', 'RA', 'GUAS'], distractors: ['LU'] },
  { word: 'PLÁTANO', emoji: '🍌', syllables: ['PLÁ', 'TA', 'NO'], distractors: ['MI'] },
  { word: 'CABALLO', emoji: '🐴', syllables: ['CA', 'BA', 'LLO'], distractors: ['RO'] },
  { word: 'GUITARRA', emoji: '🎸', syllables: ['GUI', 'TA', 'RRA'], distractors: ['PO'] },
  { word: 'MARTILLO', emoji: '🔨', syllables: ['MAR', 'TI', 'LLO'], distractors: ['SE'] },
  { word: 'TIJERAS', emoji: '✂️', syllables: ['TI', 'JE', 'RAS'], distractors: ['CA'] },
  { word: 'CANGREJO', emoji: '🦀', syllables: ['CAN', 'GRE', 'JO'], distractors: ['LU'] },
  { word: 'ESTRELLA', emoji: '⭐', syllables: ['ES', 'TRE', 'LLA'], distractors: ['PA'] },
  { word: 'TORTUGA', emoji: '🐢', syllables: ['TOR', 'TU', 'GA'], distractors: ['MI'] },
  { word: 'SOMBRERO', emoji: '🎩', syllables: ['SOM', 'BRE', 'RO'], distractors: ['TA'] },
  { word: 'CANDADO', emoji: '🔒', syllables: ['CAN', 'DA', 'DO'], distractors: ['LI'] },
  { word: 'CUCHILLO', emoji: '🔪', syllables: ['CU', 'CHI', 'LLO'], distractors: ['SA'] },
  { word: 'LINTERNA', emoji: '🔦', syllables: ['LIN', 'TER', 'NA'], distractors: ['BO'] },
  { word: 'REGALO', emoji: '🎁', syllables: ['RE', 'GA', 'LO'], distractors: ['TU'] },
]

// 14 palabras de 4 sílabas con 2 sílabas trampa (Ronda 4)
const ROUND_4_WORDS: WordEntry[] = [
  { word: 'MARIPOSA', emoji: '🦋', syllables: ['MA', 'RI', 'PO', 'SA'], distractors: ['TE', 'LU'] },
  { word: 'CHOCOLATE', emoji: '🍫', syllables: ['CHO', 'CO', 'LA', 'TE'], distractors: ['PA', 'SU'] },
  { word: 'BICICLETA', emoji: '🚲', syllables: ['BI', 'CI', 'CLE', 'TA'], distractors: ['MO', 'RA'] },
  { word: 'ELEFANTE', emoji: '🐘', syllables: ['E', 'LE', 'FAN', 'TE'], distractors: ['CA', 'SO'] },
  { word: 'ZANAHORIA', emoji: '🥕', syllables: ['ZA', 'NA', 'HO', 'RIA'], distractors: ['ME', 'PI'] },
  { word: 'AGUACATE', emoji: '🥑', syllables: ['A', 'GUA', 'CA', 'TE'], distractors: ['LO', 'RI'] },
  { word: 'CARAMELO', emoji: '🍬', syllables: ['CA', 'RA', 'ME', 'LO'], distractors: ['TU', 'FI'] },
  { word: 'TELÉFONO', emoji: '☎️', syllables: ['TE', 'LÉ', 'FO', 'NO'], distractors: ['SA', 'MI'] },
  { word: 'MELOCOTÓN', emoji: '🍑', syllables: ['ME', 'LO', 'CO', 'TÓN'], distractors: ['RA', 'LU'] },
  { word: 'CALABAZA', emoji: '🎃', syllables: ['CA', 'LA', 'BA', 'ZA'], distractors: ['TI', 'NO'] },
  { word: 'CAMISETA', emoji: '👕', syllables: ['CA', 'MI', 'SE', 'TA'], distractors: ['PO', 'LU'] },
  { word: 'PANTALONES', emoji: '👖', syllables: ['PAN', 'TA', 'LO', 'NES'], distractors: ['RI', 'CU'] },
]

interface TileInstance {
  id: string
  text: string
}

function shuffleTiles(entry: WordEntry): TileInstance[] {
  const all = [...entry.syllables, ...entry.distractors].map((text, idx) => ({
    id: `syl-${idx}-${text}`,
    text,
  }))
  for (let attempt = 0; attempt < 8; attempt++) {
    all.sort(() => 0.5 - Math.random())
    const matchesOrder = entry.syllables.every((s, i) => all[i]?.text === s)
    if (!matchesOrder) break
  }
  return all
}

export function SyllableWords({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [sessionWords, setSessionWords] = useState<WordEntry[]>([])
  const [tiles, setTiles] = useState<TileInstance[]>([])
  const [pickedIds, setPickedIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const initSession = () => {
    const w1 = pickRandom(ROUND_1_WORDS)
    const w2 = pickRandom(ROUND_2_WORDS)
    const w3 = pickRandom(ROUND_3_WORDS)
    const w4 = pickRandom(ROUND_4_WORDS)
    setSessionWords([w1, w2, w3, w4])
    setRoundIdx(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    initSession()
    return () => speech.stop()
  }, [])

  useEffect(() => {
    if (sessionWords.length === 0) return
    const current = sessionWords[roundIdx] || sessionWords[0]
    setTiles(shuffleTiles(current))
    setPickedIds([])
    setFeedback('')
    isAdvancingRef.current = false

    const timer = setTimeout(() => {
      speech.speak(
        `Forma la palabra ${current.word.toLowerCase()}. Toca sus ${current.syllables.length} sílabas en orden.`
      )
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, sessionWords])

  if (sessionWords.length === 0) return null
  const currentWord = sessionWords[roundIdx] || sessionWords[0]

  const handleSelectTile = (tile: TileInstance) => {
    if (isAdvancingRef.current || pickedIds.includes(tile.id)) return
    sound.playTap()

    const expectedIdx = pickedIds.length
    const expectedSyllable = currentWord.syllables[expectedIdx]

    if (tile.text === expectedSyllable) {
      sound.playSuccess()
      const nextPicked = [...pickedIds, tile.id]
      setPickedIds(nextPicked)
      setFeedback('')

      if (nextPicked.length === currentWord.syllables.length) {
        isAdvancingRef.current = true
        const praise = pickRandom(GENERAL_PRAISES)
        setFeedback(`¡Perfecto! ${currentWord.syllables.join(' - ')} = ${currentWord.word}`)

        let hasAdv = false
        const advance = () => {
          if (hasAdv) return
          hasAdv = true
          setTimeout(() => {
            if (roundIdx + 1 < sessionWords.length) {
              setRoundIdx((r) => r + 1)
            } else {
              setIsSuccess(true)
              onComplete()
            }
          }, 500)
        }

        const fullSpeech = `¡Muy bien! ${currentWord.word.toLowerCase()}. ${praise}`
        const dur = speech.estimateDurationMs(fullSpeech)
        speech.speak(fullSpeech, advance)
        setTimeout(advance, dur + 2200)
      }
    } else {
      sound.playGentleRetry()
      setFeedback(`«${tile.text}» no va ahora. Busca la sílaba «${expectedSyllable}».`)
      speech.speak(
        `Esa sílaba no va ahora. Busca cómo sigue la palabra ${currentWord.word.toLowerCase()}.`
      )
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-indigo-400 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <h3 className="text-2xl sm:text-4xl font-black text-stone-950">
            Ordena las sílabas
          </h3>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-indigo-100 border-2 sm:border-3 border-indigo-400 text-indigo-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            {roundIdx + 1}/4
          </span>
        </div>

        {/* Giant Illustration + Word Slots */}
        <div className="bg-indigo-50 border-3 sm:border-4 border-indigo-300 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-center gap-3 shrink-0">
          <span className="text-7xl sm:text-8xl md:text-9xl leading-none">{currentWord.emoji}</span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            {currentWord.syllables.map((syl, idx) => {
              const filled = idx < pickedIds.length
              const isCurrent = idx === pickedIds.length
              return (
                <div
                  key={idx}
                  className={`min-w-20 sm:min-w-28 h-14 sm:h-20 px-3 sm:px-5 rounded-2xl border-3 sm:border-4 flex items-center justify-center font-black text-3xl sm:text-5xl ${
                    filled
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-amber-100 border-amber-500 text-amber-900 border-dashed'
                      : 'bg-white border-indigo-300 text-indigo-300 border-dashed'
                  }`}
                >
                  {filled ? syl : '?'}
                </div>
              )
            })}
          </div>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-lg sm:text-2xl shrink-0">
            {feedback}
          </div>
        )}

        {/* Syllable Tiles */}
        <div
          className={`flex-1 min-h-0 w-full grid gap-2.5 sm:gap-4 items-stretch ${
            tiles.length === 2
              ? 'grid-cols-2 grid-rows-1'
              : tiles.length === 3
              ? 'grid-cols-3 grid-rows-1'
              : tiles.length === 4
              ? 'grid-cols-2 grid-rows-2'
              : 'grid-cols-3 grid-rows-2'
          }`}
        >
          {tiles.map((tile) => {
            const isUsed = pickedIds.includes(tile.id)
            return (
              <button
                key={tile.id}
                disabled={isUsed}
                onClick={() => handleSelectTile(tile)}
                className={`w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 flex items-center justify-center font-black text-4xl sm:text-6xl md:text-7xl transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isUsed
                    ? 'bg-stone-100 border-stone-300 text-stone-300 opacity-50 cursor-default'
                    : 'bg-amber-100 hover:bg-amber-200 border-amber-500 text-stone-950'
                }`}
              >
                {tile.text}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Palabras completadas!"
          message="Has ordenado todas las sílabas de 2, 3 y 4 partes sin fallar."
          onRestart={initSession}
          onHome={onExit}
        />
      )}
    </div>
  )
}
