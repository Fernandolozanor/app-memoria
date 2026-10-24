import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_PRAISES, GENERAL_RETRIES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface CulturalItem {
  title: string
  subtitle: string
  emoji: string
  correctPlace: string
  wrongPlaces: string[]
}

const INTRO_VOICES = [
  (t: string) => `${t}. ¿De qué lugar de España es típico?`,
  (t: string) => `Piensa un momento: ${t}. ¿Dónde se encuentra o es tradicional?`,
  (t: string) => `¿A qué ciudad o región pertenece ${t}?`,
]

// 28 platos, monumentos y fiestas tradicionales de toda España con opciones geográficamente cercanas
const SPAIN_ITEMS: CulturalItem[] = [
  {
    title: 'La Paella tradicional',
    subtitle: 'Arroz con azafrán y verduras de la huerta',
    emoji: '🥘',
    correctPlace: 'Valencia',
    wrongPlaces: ['Murcia', 'Alicante', 'Castellón', 'Albacete'],
  },
  {
    title: 'La Giralda y la Feria de Abril',
    subtitle: 'Sevillanas, farolillos y azahar',
    emoji: '💃',
    correctPlace: 'Sevilla',
    wrongPlaces: ['Córdoba', 'Huelva', 'Cádiz', 'Málaga'],
  },
  {
    title: 'El Pulpo a Feira y la Catedral',
    subtitle: 'Con pimentón, aceite y cachelos',
    emoji: '🐙',
    correctPlace: 'Galicia',
    wrongPlaces: ['Asturias', 'Castilla y León', 'Cantabria', 'País Vasco'],
  },
  {
    title: 'La Sagrada Familia',
    subtitle: 'El famoso templo de Gaudí',
    emoji: '⛪',
    correctPlace: 'Barcelona',
    wrongPlaces: ['Girona', 'Tarragona', 'Lleida', 'Zaragoza'],
  },
  {
    title: 'La Fabada y la Sidra',
    subtitle: 'Con fabes tiernas y buen escanciado',
    emoji: '🍲',
    correctPlace: 'Asturias',
    wrongPlaces: ['Cantabria', 'Galicia', 'Castilla y León', 'País Vasco'],
  },
  {
    title: 'El Acueducto Romano y el Cochinillo',
    subtitle: 'Grandes arcos de piedra milenarios',
    emoji: '🏛️',
    correctPlace: 'Segovia',
    wrongPlaces: ['Ávila', 'Madrid', 'Valladolid', 'Toledo'],
  },
  {
    title: 'Las Fiestas de San Fermín',
    subtitle: 'Pañuelo rojo el 7 de julio',
    emoji: '🎺',
    correctPlace: 'Pamplona',
    wrongPlaces: ['Logroño', 'San Sebastián', 'Vitoria', 'Zaragoza'],
  },
  {
    title: 'El Gazpacho y el Salmorejo',
    subtitle: 'Tomate fresco y aceite de oliva en verano',
    emoji: '🍅',
    correctPlace: 'Andalucía',
    wrongPlaces: ['Extremadura', 'Murcia', 'Castilla-La Mancha', 'Comunidad Valenciana'],
  },
  {
    title: 'La Alhambra y el Generalife',
    subtitle: 'Palacios nazaríes frente a Sierra Nevada',
    emoji: '🏰',
    correctPlace: 'Granada',
    wrongPlaces: ['Málaga', 'Jaén', 'Almería', 'Córdoba'],
  },
  {
    title: 'El Cocido Madrileño y el Chotis',
    subtitle: 'Fiestas de San Isidro y la Puerta de Alcalá',
    emoji: '🏺',
    correctPlace: 'Madrid',
    wrongPlaces: ['Toledo', 'Segovia', 'Guadalajara', 'Ávila'],
  },
  {
    title: 'La Basílica del Pilar y la Jota',
    subtitle: 'A orillas del río Ebro en octubre',
    emoji: '⛪',
    correctPlace: 'Zaragoza',
    wrongPlaces: ['Huesca', 'Teruel', 'Navarra', 'Logroño'],
  },
  {
    title: 'La Mezquita y los Patios con Flores',
    subtitle: 'Arcos blancos y rojos llenos de geranios',
    emoji: '🌷',
    correctPlace: 'Córdoba',
    wrongPlaces: ['Sevilla', 'Jaén', 'Granada', 'Ciudad Real'],
  },
  {
    title: 'La Universidad Histórica y la Rana',
    subtitle: 'Plaza Mayor dorada y ciudad estudiantil',
    emoji: '🎓',
    correctPlace: 'Salamanca',
    wrongPlaces: ['Zamora', 'Ávila', 'Valladolid', 'Cáceres'],
  },
  {
    title: 'Las Murallas Medievales y las Yemas',
    subtitle: 'Ciudad amurallada de piedra completa',
    emoji: '🏰',
    correctPlace: 'Ávila',
    wrongPlaces: ['Segovia', 'Salamanca', 'Madrid', 'Toledo'],
  },
  {
    title: 'La Ensaimada y las Calas Turquesas',
    subtitle: 'Dulce tradicional en espiral con azúcar glas',
    emoji: '🥐',
    correctPlace: 'Mallorca',
    wrongPlaces: ['Menorca', 'Ibiza', 'Valencia', 'Barcelona'],
  },
  {
    title: 'El Plátano con Motitas y el Teide',
    subtitle: 'Papas arrugadas con mojo picón',
    emoji: '🍌',
    correctPlace: 'Canarias',
    wrongPlaces: ['Baleares', 'Andalucía', 'Murcia', 'Ceuta'],
  },
  {
    title: 'El Mazapán y el Alcázar',
    subtitle: 'Ciudad imperial de las tres culturas sobre el Tajo',
    emoji: '🏰',
    correctPlace: 'Toledo',
    wrongPlaces: ['Madrid', 'Ciudad Real', 'Cuenca', 'Ávila'],
  },
  {
    title: 'Los Grandes Viñedos y Bodegas',
    subtitle: 'Tierra famosa en todo el mundo por su buen vino tinto',
    emoji: '🍇',
    correctPlace: 'La Rioja',
    wrongPlaces: ['Navarra', 'Álava', 'Burgos', 'Aragón'],
  },
  {
    title: 'Las Casas Colgadas',
    subtitle: 'Balcones de madera asomados sobre la hoz del río',
    emoji: '🏡',
    correctPlace: 'Cuenca',
    wrongPlaces: ['Guadalajara', 'Teruel', 'Albacete', 'Toledo'],
  },
  {
    title: 'La Playa de la Concha y los Pintxos',
    subtitle: 'Bahía elegante en el mar Cantábrico',
    emoji: '🏖️',
    correctPlace: 'San Sebastián',
    wrongPlaces: ['Bilbao', 'Vitoria', 'Pamplona', 'Santander'],
  },
  {
    title: 'El Teatro Romano y el Jamón de Bellota',
    subtitle: 'Joyas de la antigua Roma y dehesas de encinas',
    emoji: '🏛️',
    correctPlace: 'Mérida',
    wrongPlaces: ['Badajoz', 'Cáceres', 'Sevilla', 'Córdoba'],
  },
  {
    title: 'Los Carnavales y las Chirigotas',
    subtitle: 'La Tacita de Plata frente al océano Atlántico',
    emoji: '🎭',
    correctPlace: 'Cádiz',
    wrongPlaces: ['Huelva', 'Sevilla', 'Málaga', 'Ceuta'],
  },
  {
    title: 'El Turrón de Almendra Navideño',
    subtitle: 'El dulce más famoso de Jijona y Alicante',
    emoji: '🍬',
    correctPlace: 'Alicante',
    wrongPlaces: ['Valencia', 'Murcia', 'Albacete', 'Castellón'],
  },
  {
    title: 'La Catedral Gótica y la Morcilla de Arroz',
    subtitle: 'Tierra del Cid Campeador en Castilla',
    emoji: '⛪',
    correctPlace: 'Burgos',
    wrongPlaces: ['Palencia', 'Logroño', 'Valladolid', 'Soria'],
  },
  {
    title: 'El Palacio de la Magdalena y las Rabas',
    subtitle: 'Elegante bahía cantábrica y paseo de El Sardinero',
    emoji: '⚓',
    correctPlace: 'Santander',
    wrongPlaces: ['Gijón', 'Bilbao', 'Oviedo', 'San Sebastián'],
  },
  {
    title: 'Las Médulas y el Castillo Templario',
    subtitle: 'Montañas doradas y tierra de reyes leoneses',
    emoji: '⛰️',
    correctPlace: 'León',
    wrongPlaces: ['Asturias', 'Zamora', 'Palencia', 'Ourense'],
  },
  {
    title: 'La Ciudad Monumental y la Torta del Casar',
    subtitle: 'Palacios medievales, torres y nidos de cigüeña',
    emoji: '🏰',
    correctPlace: 'Cáceres',
    wrongPlaces: ['Badajoz', 'Salamanca', 'Toledo', 'Mérida'],
  },
  {
    title: 'El Torico y las Torres Mudéjares',
    subtitle: 'Plaza del Torico y la famosa historia de los Amantes',
    emoji: '🐂',
    correctPlace: 'Teruel',
    wrongPlaces: ['Zaragoza', 'Cuenca', 'Castellón', 'Guadalajara'],
  },
]

const OPTION_COUNTS = [2, 3, 4, 4]

export function SpainJourney({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [sessionItems, setSessionItems] = useState<CulturalItem[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  const initSession = () => {
    const shuffled = [...SPAIN_ITEMS].sort(() => 0.5 - Math.random()).slice(0, 4)
    setSessionItems(shuffled)
    setRoundIdx(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    initSession()
    return () => speech.stop()
  }, [])

  useEffect(() => {
    if (sessionItems.length === 0) return
    const item = sessionItems[roundIdx] || sessionItems[0]
    const count = OPTION_COUNTS[roundIdx] || 2
    const wrongs = [...item.wrongPlaces].sort(() => 0.5 - Math.random()).slice(0, count - 1)
    setOptions([item.correctPlace, ...wrongs].sort(() => 0.5 - Math.random()))
    setSelectedPlace(null)
    setFeedback('')
    isAdvancingRef.current = false

    const timer = setTimeout(() => {
      const voiceFn = pickRandom(INTRO_VOICES)
      speech.speak(voiceFn(item.title))
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, sessionItems])

  if (sessionItems.length === 0) return null
  const currentItem = sessionItems[roundIdx] || sessionItems[0]

  const handleSelectPlace = (place: string) => {
    if (isAdvancingRef.current) return
    sound.playTap()
    setSelectedPlace(place)

    if (place === currentItem.correctPlace) {
      isAdvancingRef.current = true
      sound.playSuccess()
      const praise = pickRandom(GENERAL_PRAISES)
      const msg = `¡Exacto! ${currentItem.title} es de ${currentItem.correctPlace}.`
      setFeedback(msg)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (roundIdx + 1 < sessionItems.length) {
            setRoundIdx((r) => r + 1)
          } else {
            setIsSuccess(true)
            onComplete()
          }
        }, 500)
      }

      const fullSpeech = `${msg} ${praise}`
      const dur = speech.estimateDurationMs(fullSpeech)
      speech.speak(fullSpeech, advance)
      setTimeout(advance, dur + 2200)
    } else {
      sound.playGentleRetry()
      setFeedback(`No es de ${place}. Prueba con otra opción.`)
      speech.speak(pickRandom(GENERAL_RETRIES))
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-rose-400 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <h3 className="text-2xl sm:text-4xl font-black text-stone-950">
            ¿De dónde es típico?
          </h3>
          <span className="px-3 sm:px-5 py-1 sm:py-2 bg-rose-100 border-2 sm:border-3 border-rose-400 text-rose-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl shrink-0">
            {roundIdx + 1}/4
          </span>
        </div>

        {/* Cultural Card */}
        <div className="bg-rose-50 border-3 sm:border-4 border-rose-300 rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 shrink-0">
          <span className="text-6xl sm:text-8xl leading-none shrink-0">{currentItem.emoji}</span>
          <div className="text-center sm:text-left">
            <p className="font-black text-stone-950 text-2xl sm:text-5xl leading-tight">
              {currentItem.title}
            </p>
            <p className="font-bold text-rose-900 text-lg sm:text-2xl mt-1">
              {currentItem.subtitle}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-lg sm:text-2xl shrink-0">
            {feedback}
          </div>
        )}

        {/* Options Grid */}
        <div
          className={`flex-1 min-h-0 w-full grid gap-2.5 sm:gap-4 items-stretch ${
            options.length === 2
              ? 'grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1'
              : options.length === 3
              ? 'grid-cols-1 sm:grid-cols-3 grid-rows-3 sm:grid-rows-1'
              : 'grid-cols-2 grid-rows-2'
          }`}
        >
          {options.map((place) => {
            const isChosen = selectedPlace === place
            const isCorrect = place === currentItem.correctPlace
            return (
              <button
                key={place}
                onClick={() => handleSelectPlace(place)}
                className={`w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 p-3 sm:p-6 flex items-center justify-center font-black text-3xl sm:text-5xl cursor-pointer transition-all active:scale-95 shadow-sm ${
                  isChosen
                    ? isCorrect
                      ? 'bg-emerald-600 border-emerald-700 text-white ring-4 ring-emerald-300'
                      : 'bg-amber-100 border-amber-400 text-amber-950 opacity-75'
                    : 'bg-stone-50 hover:bg-rose-50 border-stone-300 hover:border-rose-400 text-stone-950'
                }`}
              >
                📍 {place}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Gran viajero!"
          message="Conoces de maravilla las tradiciones, platos y rincones de toda España."
          onRestart={initSession}
          onHome={onExit}
        />
      )}
    </div>
  )
}
