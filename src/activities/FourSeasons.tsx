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

type SeasonId = 'primavera' | 'verano' | 'otono' | 'invierno'

interface SeasonMeta {
  id: SeasonId
  name: string
  emoji: string
  bg: string
  border: string
}

const SEASONS: Record<SeasonId, SeasonMeta> = {
  primavera: { id: 'primavera', name: 'Primavera', emoji: '🌸', bg: 'bg-pink-50 hover:bg-pink-100', border: 'border-pink-400' },
  verano: { id: 'verano', name: 'Verano', emoji: '☀️', bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-400' },
  otono: { id: 'otono', name: 'Otoño', emoji: '🍂', bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-400' },
  invierno: { id: 'invierno', name: 'Invierno', emoji: '❄️', bg: 'bg-sky-50 hover:bg-sky-100', border: 'border-sky-400' },
}

// Natural order of the year (used by the "what comes next" round)
const SEASON_ORDER: SeasonId[] = ['primavera', 'verano', 'otono', 'invierno']
const ALL_SEASONS: SeasonMeta[] = SEASON_ORDER.map((id) => SEASONS[id])

interface SeasonCard {
  id: string
  title: string
  emoji: string
  season: SeasonId
}

// Escenas cotidianas (9 por estación)
const SCENES: SeasonCard[] = [
  { id: 'v1', title: 'Bañarse en la playa y tomar el sol', emoji: '🏖️', season: 'verano' },
  { id: 'v2', title: 'Comer sandía fresca y melón', emoji: '🍉', season: 'verano' },
  { id: 'v3', title: 'Gazpacho fresquito para comer', emoji: '🍅', season: 'verano' },
  { id: 'v4', title: 'Tomar un helado de cucurucho', emoji: '🍦', season: 'verano' },
  { id: 'v5', title: 'Ponerse bañador y sandalias', emoji: '👙', season: 'verano' },
  { id: 'v6', title: 'Vacaciones de agosto junto al mar', emoji: '⛵', season: 'verano' },
  { id: 'v7', title: 'Tardes largas con mucho calor', emoji: '☀️', season: 'verano' },
  { id: 'v8', title: 'Cenar al fresco en la terraza', emoji: '🌙', season: 'verano' },
  { id: 'v9', title: 'Ponerse la pamela para el sol', emoji: '👒', season: 'verano' },

  { id: 'i1', title: 'Ropa de abrigo y chimenea encendida', emoji: '⛄', season: 'invierno' },
  { id: 'i2', title: 'Ver nevar en la montaña', emoji: '❄️', season: 'invierno' },
  { id: 'i3', title: 'Esquiar en la nieve blanca', emoji: '🎿', season: 'invierno' },
  { id: 'i4', title: 'Tomar un caldo bien caliente', emoji: '🍲', season: 'invierno' },
  { id: 'i5', title: 'Árbol de Navidad y villancicos', emoji: '🎄', season: 'invierno' },
  { id: 'i6', title: 'Ponerse botas calientes para el frío', emoji: '👢', season: 'invierno' },
  { id: 'i7', title: 'Taza de chocolate con churros', emoji: '☕', season: 'invierno' },
  { id: 'i8', title: 'Días muy cortos que anochecen pronto', emoji: '🌃', season: 'invierno' },
  { id: 'i9', title: 'Comer polvorones y turrón', emoji: '🍬', season: 'invierno' },

  { id: 'o1', title: 'Asar castañas en la calle', emoji: '🌰', season: 'otono' },
  { id: 'o2', title: 'Caen las hojas secas de los árboles', emoji: '🍂', season: 'otono' },
  { id: 'o3', title: 'Recoger las uvas en la vendimia', emoji: '🍇', season: 'otono' },
  { id: 'o4', title: 'Primeras lluvias tras el verano', emoji: '☔', season: 'otono' },
  { id: 'o5', title: 'Los niños vuelven al colegio', emoji: '🎒', season: 'otono' },
  { id: 'o6', title: 'Recoger calabazas y boniatos', emoji: '🎃', season: 'otono' },
  { id: 'o7', title: 'Bosques de color marrón y dorado', emoji: '🍁', season: 'otono' },
  { id: 'o8', title: 'Buscar setas en el monte húmedo', emoji: '🍄', season: 'otono' },
  { id: 'o9', title: 'Hacer membrillo con los membrillos', emoji: '🍐', season: 'otono' },

  { id: 'p1', title: 'Florecen los jardines y los rosales', emoji: '🌷', season: 'primavera' },
  { id: 'p2', title: 'Golondrinas y mariposas en el campo', emoji: '🦋', season: 'primavera' },
  { id: 'p3', title: 'Primeras fresas y cerezas', emoji: '🍓', season: 'primavera' },
  { id: 'p4', title: 'Ramos de flores llenos de aroma', emoji: '💐', season: 'primavera' },
  { id: 'p5', title: 'Abejas volando de flor en flor', emoji: '🐝', season: 'primavera' },
  { id: 'p6', title: 'Los campos se visten de verde', emoji: '🌱', season: 'primavera' },
  { id: 'p7', title: 'Los pajaritos hacen sus nidos', emoji: '🐦', season: 'primavera' },
  { id: 'p8', title: 'Arcoíris tras un chaparrón de abril', emoji: '🌈', season: 'primavera' },
  { id: 'p9', title: 'Los almendros se llenan de flores', emoji: '🌸', season: 'primavera' },
]

// Meses y fiestas del calendario español (Ronda 2)
const CALENDAR: SeasonCard[] = [
  { id: 'c1', title: 'El mes de enero', emoji: '📅', season: 'invierno' },
  { id: 'c2', title: 'El mes de febrero', emoji: '📅', season: 'invierno' },
  { id: 'c3', title: 'El mes de abril', emoji: '📅', season: 'primavera' },
  { id: 'c4', title: 'El mes de mayo', emoji: '📅', season: 'primavera' },
  { id: 'c5', title: 'El mes de julio', emoji: '📅', season: 'verano' },
  { id: 'c6', title: 'El mes de agosto', emoji: '📅', season: 'verano' },
  { id: 'c7', title: 'El mes de octubre', emoji: '📅', season: 'otono' },
  { id: 'c8', title: 'El mes de noviembre', emoji: '📅', season: 'otono' },
  { id: 'c9', title: 'La noche de San Juan con hogueras', emoji: '🔥', season: 'verano' },
  { id: 'c10', title: 'El Día de los Reyes Magos', emoji: '👑', season: 'invierno' },
  { id: 'c11', title: 'La Nochevieja y las doce uvas', emoji: '🥂', season: 'invierno' },
  { id: 'c12', title: 'El Día de Todos los Santos', emoji: '🕯️', season: 'otono' },
  { id: 'c13', title: 'La Feria de Abril de Sevilla', emoji: '💃', season: 'primavera' },
  { id: 'c14', title: 'Las Fallas de Valencia en marzo', emoji: '🎆', season: 'primavera' },
  { id: 'c15', title: 'Las fiestas de San Fermín en julio', emoji: '🎺', season: 'verano' },
  { id: 'c16', title: 'La fiesta del Pilar en octubre', emoji: '⛪', season: 'otono' },
]

const ROUND_LABELS = [
  '¿De qué estación es?',
  'Meses y fiestas',
  'Busca el intruso',
  'El orden del año',
  'Coloca cada cosa',
]
const TOTAL_ROUNDS = ROUND_LABELS.length

function shuffle<T>(list: T[]): T[] {
  return [...list].sort(() => 0.5 - Math.random())
}

interface OrderQuestion {
  text: string
  spoken: string
  answer: SeasonId
}

function buildOrderQuestion(): OrderQuestion {
  const baseIdx = Math.floor(Math.random() * 4)
  const base = SEASONS[SEASON_ORDER[baseIdx]]
  if (Math.random() < 0.5) {
    const answer = SEASON_ORDER[(baseIdx + 1) % 4]
    return {
      text: `Después del ${base.name.toLowerCase()} ${base.emoji} llega...`,
      spoken: `Piensa en el orden del año. Después del ${base.name.toLowerCase()}, ¿qué estación llega?`,
      answer,
    }
  }
  const answer = SEASON_ORDER[(baseIdx + 3) % 4]
  return {
    text: `Antes del ${base.name.toLowerCase()} ${base.emoji} viene...`,
    spoken: `Piensa en el orden del año. ¿Qué estación viene justo antes del ${base.name.toLowerCase()}?`,
    answer,
  }
}

// La palabra "primavera" es femenina: "la primavera", el resto masculinas
function withArticle(s: SeasonMeta): string {
  return s.id === 'primavera' ? `la ${s.name.toLowerCase()}` : `el ${s.name.toLowerCase()}`
}

export function FourSeasons({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  // Round 1 & 2: single card -> season
  const [r1Card, setR1Card] = useState<SeasonCard>(SCENES[0])
  const [r2Card, setR2Card] = useState<SeasonCard>(CALENDAR[0])
  // Round 3: intruder
  const [r3Cards, setR3Cards] = useState<SeasonCard[]>([])
  const [r3IntruderId, setR3IntruderId] = useState('')
  // Round 4: order of seasons
  const [r4Question, setR4Question] = useState<OrderQuestion>(() => buildOrderQuestion())
  // Round 5: classify 4 cards into 4 seasons
  const [r5Cards, setR5Cards] = useState<SeasonCard[]>([])
  const [r5Placed, setR5Placed] = useState<Record<string, SeasonId>>({})
  const [r5SelectedId, setR5SelectedId] = useState<string | null>(null)

  const [wrongPick, setWrongPick] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const initSession = () => {
    // Round 1: a random everyday scene
    setR1Card(pickRandom(SCENES))
    // Round 2: a random month or festivity
    setR2Card(pickRandom(CALENDAR))

    // Round 3: 3 scenes of one season + 1 intruder of a different season
    const mainSeason = pickRandom(SEASON_ORDER)
    const sameSeason = shuffle(SCENES.filter((s) => s.season === mainSeason)).slice(0, 3)
    const intruder = pickRandom(SCENES.filter((s) => s.season !== mainSeason))
    setR3Cards(shuffle([...sameSeason, intruder]))
    setR3IntruderId(intruder.id)

    // Round 4: before / after question
    setR4Question(buildOrderQuestion())

    // Round 5: one scene from each season
    const oneEach = SEASON_ORDER.map((sid) => pickRandom(SCENES.filter((s) => s.season === sid)))
    setR5Cards(shuffle(oneEach))
    setR5Placed({})
    setR5SelectedId(null)

    setRoundIdx(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    initSession()
    return () => speech.stop()
  }, [])

  // Voice prompt for each round
  useEffect(() => {
    setFeedback('')
    setWrongPick(null)
    isAdvancingRef.current = false

    let prompt = ''
    if (roundIdx === 0) prompt = `${r1Card.title}. ¿En qué estación del año ocurre?`
    else if (roundIdx === 1) prompt = `${r2Card.title}. ¿En qué estación del año cae?`
    else if (roundIdx === 2)
      prompt = 'Tres de estas cosas son de la misma estación y una se ha colado. ¿Cuál es el intruso?'
    else if (roundIdx === 3) prompt = r4Question.spoken
    else prompt = 'Última ronda. Toca una tarjeta y después la estación donde va. Coloca las cuatro.'

    const timer = setTimeout(() => speech.speak(prompt), 250)
    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, r1Card, r2Card, r4Question])

  const advanceNext = (extraMsg = '') => {
    isAdvancingRef.current = true
    sound.playSuccess()
    const praise = pickRandom(GENERAL_PRAISES)
    const text = extraMsg ? `${extraMsg} ${praise}` : praise
    setFeedback(text)

    let hasAdv = false
    const go = () => {
      if (hasAdv) return
      hasAdv = true
      setTimeout(() => {
        if (roundIdx + 1 < TOTAL_ROUNDS) {
          setRoundIdx((r) => r + 1)
        } else {
          setIsSuccess(true)
          onComplete()
        }
      }, 500)
    }
    const dur = speech.estimateDurationMs(text)
    speech.speak(text, go)
    setTimeout(go, dur + 2200)
  }

  const handleWrong = (pickId: string, msg: string) => {
    sound.playGentleRetry()
    setWrongPick(pickId)
    setFeedback(msg)
    speech.speak(pickRandom(GENERAL_RETRIES))
  }

  // Rounds 1, 2 and 4: choose a season
  const handlePickSeason = (meta: SeasonMeta) => {
    if (isAdvancingRef.current) return
    sound.playTap()

    const answer =
      roundIdx === 0 ? r1Card.season : roundIdx === 1 ? r2Card.season : r4Question.answer

    if (meta.id === answer) {
      setWrongPick(null)
      advanceNext(roundIdx === 3 ? `¡Eso es! Toca ${withArticle(meta)}.` : '')
    } else {
      handleWrong(meta.id, `No es ${withArticle(meta)}. Piénsalo con calma.`)
    }
  }

  // Round 3: find the intruder
  const handlePickIntruder = (card: SeasonCard) => {
    if (isAdvancingRef.current) return
    sound.playTap()
    if (card.id === r3IntruderId) {
      setWrongPick(null)
      const s = SEASONS[card.season]
      advanceNext(`¡Bien visto! Eso es de ${s.name.toLowerCase()}.`)
    } else {
      handleWrong(card.id, 'Esa sí va con las demás. Busca la que es de otra estación.')
    }
  }

  // Round 5: select a card, then the season box
  const handleSelectR5Card = (card: SeasonCard) => {
    if (isAdvancingRef.current || r5Placed[card.id]) return
    sound.playTap()
    setR5SelectedId(card.id)
    setWrongPick(null)
    setFeedback(`Ahora toca la estación de: «${card.title}»`)
  }

  const handlePlaceInSeason = (meta: SeasonMeta) => {
    if (isAdvancingRef.current) return
    if (!r5SelectedId) {
      sound.playTap()
      setFeedback('Primero toca una de las tarjetas de abajo.')
      speech.speak('Primero toca una de las tarjetas de abajo.')
      return
    }
    const card = r5Cards.find((c) => c.id === r5SelectedId)
    if (!card) return

    if (card.season === meta.id) {
      const nextPlaced = { ...r5Placed, [card.id]: meta.id }
      setR5Placed(nextPlaced)
      setR5SelectedId(null)
      setWrongPick(null)
      if (Object.keys(nextPlaced).length === r5Cards.length) {
        advanceNext('¡Todo colocado en su estación!')
      } else {
        sound.playSuccess()
        setFeedback(`¡Muy bien! Va en ${withArticle(meta)}.`)
        speech.speak('¡Correcto!')
      }
    } else {
      handleWrong(meta.id, `«${card.title}» no va en ${withArticle(meta)}. Prueba otra.`)
    }
  }

  const header = (
    <div className="flex items-center justify-between gap-2 px-1 shrink-0">
      <h3 className="text-2xl sm:text-4xl font-black text-stone-950 text-left leading-tight">
        {ROUND_LABELS[roundIdx]}
      </h3>
      <span className="px-3 sm:px-5 py-1 sm:py-2 bg-amber-100 border-2 sm:border-3 border-amber-400 text-amber-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
        {roundIdx + 1}/{TOTAL_ROUNDS}
      </span>
    </div>
  )

  const feedbackBanner = feedback && (
    <div className="p-1.5 sm:p-2.5 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-lg sm:text-2xl shrink-0">
      {feedback}
    </div>
  )

  const seasonButtons = (
    <div className="flex-1 min-h-0 w-full grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 items-stretch">
      {ALL_SEASONS.map((s) => (
        <button
          key={s.id}
          onClick={() => handlePickSeason(s)}
          className={`w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 p-2 sm:p-5 flex flex-col items-center justify-center gap-1 sm:gap-2 cursor-pointer transition-all active:scale-95 shadow-sm text-stone-950 ${
            wrongPick === s.id ? 'bg-amber-100 border-amber-400 opacity-60' : `${s.bg} ${s.border}`
          }`}
        >
          <span className="text-5xl sm:text-7xl leading-none">{s.emoji}</span>
          <span className="font-black text-3xl sm:text-5xl leading-none">{s.name}</span>
        </button>
      ))}
    </div>
  )

  const singleCard = (card: SeasonCard) => (
    <div className="bg-amber-50 border-3 sm:border-4 border-amber-300 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-row items-center justify-center gap-3 sm:gap-5 shrink-0">
      <span className="text-6xl sm:text-8xl leading-none shrink-0">{card.emoji}</span>
      <p className="font-black text-stone-950 text-2xl sm:text-5xl leading-tight text-left">
        {card.title}
      </p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-amber-400 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {header}

        {/* RONDA 1: escena -> estación */}
        {roundIdx === 0 && (
          <>
            {singleCard(r1Card)}
            {feedbackBanner}
            {seasonButtons}
          </>
        )}

        {/* RONDA 2: mes o fiesta -> estación */}
        {roundIdx === 1 && (
          <>
            {singleCard(r2Card)}
            {feedbackBanner}
            {seasonButtons}
          </>
        )}

        {/* RONDA 3: el intruso */}
        {roundIdx === 2 && (
          <>
            <p className="text-xl sm:text-3xl font-black text-amber-900 shrink-0">
              Tres son de la misma estación. ¿Cuál no encaja?
            </p>
            {feedbackBanner}
            <div className="flex-1 min-h-0 w-full grid grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2 gap-2 sm:gap-3 items-stretch">
              {r3Cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handlePickIntruder(card)}
                  className={`w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 px-3 sm:px-5 py-1 flex items-center gap-3 sm:gap-4 text-left cursor-pointer transition-all active:scale-95 ${
                    wrongPick === card.id
                      ? 'bg-amber-100 border-amber-400 opacity-60'
                      : 'bg-stone-50 hover:bg-amber-50 border-stone-300 hover:border-amber-400'
                  }`}
                >
                  <span className="text-5xl sm:text-7xl leading-none shrink-0">{card.emoji}</span>
                  <span className="font-black text-stone-950 text-xl sm:text-3xl leading-tight">
                    {card.title}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* RONDA 4: orden de las estaciones */}
        {roundIdx === 3 && (
          <>
            <div className="bg-amber-50 border-3 sm:border-4 border-amber-300 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shrink-0">
              <p className="font-black text-stone-950 text-3xl sm:text-5xl leading-tight">
                {r4Question.text}
              </p>
            </div>
            {feedbackBanner}
            {seasonButtons}
          </>
        )}

        {/* RONDA 5: clasificar 4 tarjetas en 4 estaciones */}
        {roundIdx === 4 && (
          <>
            {feedbackBanner || (
              <p className="text-lg sm:text-2xl font-black text-amber-900 shrink-0">
                Toca una tarjeta y luego su estación
              </p>
            )}

            {/* Season boxes */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3 shrink-0">
              {ALL_SEASONS.map((s) => {
                const placedCard = r5Cards.find((c) => r5Placed[c.id] === s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => handlePlaceInSeason(s)}
                    className={`min-h-24 sm:min-h-36 rounded-2xl border-3 sm:border-4 p-1 sm:p-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 ${
                      wrongPick === s.id
                        ? 'bg-amber-100 border-amber-400 opacity-60'
                        : `${s.bg} ${s.border}`
                    } ${r5SelectedId && !placedCard ? 'ring-4 ring-amber-300 animate-pulse' : ''}`}
                  >
                    <span className="text-3xl sm:text-5xl leading-none">{s.emoji}</span>
                    <span className="font-black text-base sm:text-2xl text-stone-950 leading-none">
                      {s.name}
                    </span>
                    {placedCard && (
                      <span className="text-3xl sm:text-5xl leading-none mt-1">{placedCard.emoji}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Cards to place */}
            <div className="flex-1 min-h-0 w-full grid grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2 gap-2 sm:gap-3 items-stretch">
              {r5Cards.map((card) => {
                const placed = !!r5Placed[card.id]
                const selected = r5SelectedId === card.id
                return (
                  <button
                    key={card.id}
                    disabled={placed}
                    onClick={() => handleSelectR5Card(card)}
                    className={`relative w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 px-3 sm:px-4 py-1 flex items-center gap-3 text-left cursor-pointer transition-all active:scale-95 ${
                      placed
                        ? 'bg-emerald-100 border-emerald-500 opacity-70 cursor-default'
                        : selected
                        ? 'bg-amber-200 border-amber-600 ring-4 ring-amber-300'
                        : 'bg-stone-50 hover:bg-amber-50 border-stone-300 hover:border-amber-400'
                    }`}
                  >
                    {placed && (
                      <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-4xl sm:text-6xl leading-none shrink-0">{card.emoji}</span>
                    <span className="font-black text-stone-950 text-lg sm:text-2xl md:text-3xl leading-tight">
                      {card.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Todo en su estación!"
          message="Conoces a la perfección cada época del año, sus meses y sus fiestas."
          onRestart={initSession}
          onHome={onExit}
        />
      )}
    </div>
  )
}
