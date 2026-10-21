import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SpeakerButton } from '../components/SpeakerButton'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, ODD_ONE_OUT_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface Item {
  name: string
  icon: string
}

interface Family {
  category: string
  name: string
  items: Item[]
}

const ALL_FAMILIES: Family[] = [
  {
    category: 'las frutas',
    name: 'Frutas',
    items: [
      { name: 'Manzana', icon: '🍎' },
      { name: 'Plátano', icon: '🍌' },
      { name: 'Naranja', icon: '🍊' },
      { name: 'Pera', icon: '🍐' },
      { name: 'Uvas', icon: '🍇' },
      { name: 'Fresas', icon: '🍓' },
      { name: 'Sandía', icon: '🍉' },
      { name: 'Limón', icon: '🍋' },
    ],
  },
  {
    category: 'los animales',
    name: 'Animales',
    items: [
      { name: 'Perro', icon: '🐶' },
      { name: 'Gato', icon: '🐱' },
      { name: 'Caballo', icon: '🐴' },
      { name: 'Pájaro', icon: '🐦' },
      { name: 'Pez', icon: '🐟' },
      { name: 'Vaca', icon: '🐮' },
      { name: 'Conejo', icon: '🐰' },
      { name: 'Gallina', icon: '🐔' },
    ],
  },
  {
    category: 'los objetos de cocina',
    name: 'Cocina',
    items: [
      { name: 'Sartén', icon: '🍳' },
      { name: 'Cuchara', icon: '🥄' },
      { name: 'Taza', icon: '☕' },
      { name: 'Cuchillo', icon: '🔪' },
      { name: 'Plato', icon: '🍽️' },
      { name: 'Vaso de leche', icon: '🥛' },
    ],
  },
  {
    category: 'las prendas de vestir',
    name: 'Ropa',
    items: [
      { name: 'Sombrero', icon: '👒' },
      { name: 'Camisa', icon: '👕' },
      { name: 'Pantalón', icon: '👖' },
      { name: 'Zapato', icon: '👞' },
      { name: 'Vestido', icon: '👗' },
      { name: 'Bufanda', icon: '🧣' },
      { name: 'Calcetines', icon: '🧦' },
    ],
  },
  {
    category: 'los medios de transporte',
    name: 'Transportes',
    items: [
      { name: 'Coche', icon: '🚗' },
      { name: 'Autobús', icon: '🚌' },
      { name: 'Tren', icon: '🚂' },
      { name: 'Avión', icon: '✈️' },
      { name: 'Barco', icon: '⛵' },
      { name: 'Bicicleta', icon: '🚲' },
      { name: 'Moto', icon: '🏍️' },
    ],
  },
  {
    category: 'las flores y plantas',
    name: 'Flores y plantas',
    items: [
      { name: 'Rosa roja', icon: '🌹' },
      { name: 'Flor rosa', icon: '🌸' },
      { name: 'Girasol', icon: '🌻' },
      { name: 'Árbol', icon: '🌳' },
      { name: 'Trébol', icon: '☘️' },
      { name: 'Hoja verde', icon: '🍃' },
      { name: 'Palmera', icon: '🌴' },
    ],
  },
  {
    category: 'los instrumentos musicales',
    name: 'Música',
    items: [
      { name: 'Guitarra', icon: '🎸' },
      { name: 'Trompeta', icon: '🎺' },
      { name: 'Violín', icon: '🎻' },
      { name: 'Tambor', icon: '🥁' },
      { name: 'Piano', icon: '🎹' },
      { name: 'Saxofón', icon: '🎷' },
    ],
  },
  {
    category: 'las cosas del hogar',
    name: 'Hogar',
    items: [
      { name: 'Cama', icon: '🛏️' },
      { name: 'Silla', icon: '🪑' },
      { name: 'Puerta', icon: '🚪' },
      { name: 'Lámpara', icon: '💡' },
      { name: 'Llave', icon: '🗝️' },
      { name: 'Reloj despertador', icon: '⏰' },
    ],
  },
  {
    category: 'el cielo y el tiempo',
    name: 'Cielo',
    items: [
      { name: 'Sol', icon: '☀️' },
      { name: 'Luna', icon: '🌙' },
      { name: 'Estrella', icon: '⭐' },
      { name: 'Nube', icon: '☁️' },
      { name: 'Lluvia', icon: '🌧️' },
      { name: 'Arcoíris', icon: '🌈' },
    ],
  },
  {
    category: 'las verduras y hortalizas',
    name: 'Verduras',
    items: [
      { name: 'Tomate', icon: '🍅' },
      { name: 'Zanahoria', icon: '🥕' },
      { name: 'Patata', icon: '🥔' },
      { name: 'Berenjena', icon: '🍆' },
      { name: 'Maíz', icon: '🌽' },
      { name: 'Pepino', icon: '🥒' },
      { name: 'Champiñón', icon: '🍄' },
    ],
  },
  {
    category: 'el material para escribir',
    name: 'Papelería',
    items: [
      { name: 'Libro', icon: '📖' },
      { name: 'Lápiz', icon: '✏️' },
      { name: 'Tijeras', icon: '✂️' },
      { name: 'Libreta', icon: '📓' },
      { name: 'Carta', icon: '✉️' },
      { name: 'Periódico', icon: '📰' },
    ],
  },
  {
    category: 'los juegos y deportes',
    name: 'Deportes',
    items: [
      { name: 'Balón de fútbol', icon: '⚽' },
      { name: 'Pelota de tenis', icon: '🎾' },
      { name: 'Balón de baloncesto', icon: '🏀' },
      { name: 'Diana', icon: '🎯' },
      { name: 'Baraja de cartas', icon: '🃏' },
      { name: 'Trofeo', icon: '🏆' },
    ],
  },
]

interface CardItem extends Item {
  id: string
  isOdd: boolean
}

interface RoundData {
  family: Family
  intruder: Item
  cards: CardItem[]
  cardCount: number
}

// 3 rounds: 4 cards, 5 cards, 6 cards
const ROUND_CARD_COUNTS = [4, 5, 6]

function generateSessionRounds(): RoundData[] {
  // Shuffle families to pick 3 distinct families for the 3 rounds
  const shuffledFamilies = [...ALL_FAMILIES].sort(() => 0.5 - Math.random())
  const selectedFamilies = shuffledFamilies.slice(0, 3)

  return selectedFamilies.map((family, idx) => {
    const cardCount = ROUND_CARD_COUNTS[idx] // 4, 5, 6
    const familyItemsNeeded = cardCount - 1 // 3, 4, 5

    // Pick family members
    const shuffledItems = [...family.items].sort(() => 0.5 - Math.random())
    const familyMembers = shuffledItems.slice(0, familyItemsNeeded)

    // Pick 1 intruder from a completely different family
    const otherFamilies = ALL_FAMILIES.filter((f) => f.category !== family.category)
    const randomOtherFamily = otherFamilies[Math.floor(Math.random() * otherFamilies.length)]
    const randomIntruder = randomOtherFamily.items[Math.floor(Math.random() * randomOtherFamily.items.length)]

    // Build cards array and shuffle
    const cards: CardItem[] = [
      ...familyMembers.map((m, i) => ({ ...m, id: `fam-${i}-${m.name}`, isOdd: false })),
      { ...randomIntruder, id: `odd-${randomIntruder.name}`, isOdd: true },
    ].sort(() => 0.5 - Math.random())

    return {
      family,
      intruder: randomIntruder,
      cards,
      cardCount,
    }
  })
}

export function OddOneOut({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0) // 0 (4 cards), 1 (5 cards), 2 (6 cards)
  const [sessionRounds, setSessionRounds] = useState<RoundData[]>(generateSessionRounds)
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const currentRound = sessionRounds[roundIdx] || sessionRounds[0]

  useEffect(() => {
    setFeedback('')
    setIsSuccess(false)
    isAdvancingRef.current = false

    const timer = setTimeout(() => {
      const introVoice = pickRandom(ODD_ONE_OUT_VOICES.intro)(currentRound.family.category)
      speech.speak(introVoice)
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, sessionRounds])

  const handleCardClick = (card: CardItem) => {
    if (isAdvancingRef.current) return
    sound.playTap()

    if (card.isOdd) {
      isAdvancingRef.current = true
      sound.playSuccess()
      const praise = pickRandom(ODD_ONE_OUT_VOICES.correct)(card.name, currentRound.family.category)
      setFeedback(praise)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (roundIdx + 1 < sessionRounds.length) {
            setRoundIdx((prev) => prev + 1)
          } else {
            setIsSuccess(true)
            onComplete()
          }
        }, 500)
      }

      speech.speak(praise, advance)
      setTimeout(advance, 7000)
    } else {
      sound.playGentleRetry()
      const wrongMsg = pickRandom(ODD_ONE_OUT_VOICES.wrong)(currentRound.family.category)
      setFeedback(`"${card.name}" sí es de ${currentRound.family.category}. Busca el que no encaja.`)
      speech.speak(wrongMsg)
    }
  }

  const handleRestart = () => {
    setSessionRounds(generateSessionRounds())
    setRoundIdx(0)
    setIsSuccess(false)
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl mx-auto overflow-hidden h-full">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-4 border-2 sm:border-3 border-purple-300 mb-1.5 sm:mb-4 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Ronda:</span>
          <span className="px-2.5 sm:px-4 py-1 sm:py-2 bg-purple-100 text-purple-950 font-black rounded-xl sm:rounded-2xl text-sm sm:text-2xl">
            {roundIdx + 1} de 3 ({currentRound.cardCount} cartas)
          </span>
        </div>

        <SpeakerButton
          text={`Toca el dibujo diferente. ¿Cuál no pertenece a ${currentRound.family.category}?`}
          label="Escuchar"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-purple-400 rounded-2xl sm:rounded-3xl p-2.5 sm:p-8 shadow-md text-center min-h-0 overflow-hidden">
        <div className="shrink-0">
          <h3 className="text-lg sm:text-3xl font-black text-stone-950 mb-0.5 sm:mb-2">
            ¿Cuál es el intruso?
          </h3>
          <p className="text-xs sm:text-xl font-bold text-stone-700">
            Toca el que <span className="text-purple-700 underline font-black">NO</span> pertenece a {currentRound.family.category}:
          </p>
        </div>

        {feedback && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-purple-100 border-2 border-purple-400 text-purple-950 font-black text-sm sm:text-2xl mb-1 sm:mb-4 animate-in fade-in shrink-0">
            {feedback}
          </div>
        )}

        {/* Dynamic cards grid: 4 cards (2 cols), 5 or 6 cards (3 cols = 2 rows!) */}
        <div
          className={`grid gap-2 sm:gap-4 w-full max-w-xl mx-auto flex-1 min-h-0 my-auto items-center ${
            currentRound.cardCount === 4 ? 'grid-cols-2' : 'grid-cols-3'
          }`}
        >
          {currentRound.cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="p-2 sm:p-5 rounded-2xl sm:rounded-3xl bg-stone-50 hover:bg-purple-50 border-2 sm:border-4 border-stone-300 hover:border-purple-500 shadow-xs sm:shadow-md active:scale-95 flex flex-col items-center justify-center h-full min-h-[64px] sm:min-h-[150px] transition-all cursor-pointer"
              aria-label={card.name}
            >
              <span className="text-3xl sm:text-6xl mb-0.5 sm:mb-1" aria-hidden="true">
                {card.icon}
              </span>
              <span className="font-black text-stone-950 text-xs sm:text-xl text-center leading-tight break-words w-full px-1">
                {card.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has descubierto todos los intrusos de 4, 5 y 6 cartas con éxito."
          onRestart={handleRestart}
          onHome={onExit}
        />
      )}
    </div>
  )
}
