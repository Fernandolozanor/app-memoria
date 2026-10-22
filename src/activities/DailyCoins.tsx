import { useState, useEffect, useRef } from 'react'
import { RotateCcw, ShoppingBag } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, DAILY_COINS_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface ItemDefinition {
  name: string
  priceLabel: string
  targetCents: number
  requiredCoinCount: number // 2, 3, 4, or 5
  solutionCoins: number[] // values in cents that sum to targetCents
  emoji: string
}

interface CoinInstance {
  instanceId: string
  valueCents: number
  label: string
  type: '2e' | '1e' | '50c' | '20c' | '10c' | '5c'
}

// Rich catalogs of everyday Spanish articles for each coin tier
const ROUND_1_ITEMS: ItemDefinition[] = [
  { name: 'Una barra de pan rústica', priceLabel: '1,50 €', targetCents: 150, requiredCoinCount: 2, solutionCoins: [100, 50], emoji: '🥖' },
  { name: 'Un café con leche', priceLabel: '1,20 €', targetCents: 120, requiredCoinCount: 2, solutionCoins: [100, 20], emoji: '☕' },
  { name: 'El periódico del día', priceLabel: '2,50 €', targetCents: 250, requiredCoinCount: 2, solutionCoins: [200, 50], emoji: '📰' },
  { name: 'Una botella de leche', priceLabel: '1,10 €', targetCents: 110, requiredCoinCount: 2, solutionCoins: [100, 10], emoji: '🥛' },
  { name: 'Una manzana fresca', priceLabel: '0,70 €', targetCents: 70, requiredCoinCount: 2, solutionCoins: [50, 20], emoji: '🍎' },
  { name: 'Una revista de pasatiempos', priceLabel: '3,00 €', targetCents: 300, requiredCoinCount: 2, solutionCoins: [200, 100], emoji: '📖' },
  { name: 'Una pastilla de jabón', priceLabel: '0,60 €', targetCents: 60, requiredCoinCount: 2, solutionCoins: [50, 10], emoji: '🧼' },
  { name: 'Un billete de autobús', priceLabel: '1,50 €', targetCents: 150, requiredCoinCount: 2, solutionCoins: [100, 50], emoji: '🚌' },
  { name: 'Una libreta de notas', priceLabel: '2,20 €', targetCents: 220, requiredCoinCount: 2, solutionCoins: [200, 20], emoji: '📓' },
  { name: 'Un paquete de pañuelos', priceLabel: '0,30 €', targetCents: 30, requiredCoinCount: 2, solutionCoins: [20, 10], emoji: '🧻' },
  { name: 'Dos barras de pan', priceLabel: '2,00 €', targetCents: 200, requiredCoinCount: 2, solutionCoins: [100, 100], emoji: '🥖' },
  { name: 'Una revista ilustrada', priceLabel: '4,00 €', targetCents: 400, requiredCoinCount: 2, solutionCoins: [200, 200], emoji: '🗞️' },
]

const ROUND_2_ITEMS: ItemDefinition[] = [
  { name: 'Café y cruasán recién hecho', priceLabel: '2,70 €', targetCents: 270, requiredCoinCount: 3, solutionCoins: [200, 50, 20], emoji: '🥐' },
  { name: 'Un kilo de naranjas dulces', priceLabel: '1,70 €', targetCents: 170, requiredCoinCount: 3, solutionCoins: [100, 50, 20], emoji: '🍊' },
  { name: 'Una docena de huevos frescos', priceLabel: '2,60 €', targetCents: 260, requiredCoinCount: 3, solutionCoins: [200, 50, 10], emoji: '🥚' },
  { name: 'Un manojo de plátanos', priceLabel: '1,60 €', targetCents: 160, requiredCoinCount: 3, solutionCoins: [100, 50, 10], emoji: '🍌' },
  { name: 'Aceite de oliva pequeño', priceLabel: '3,50 €', targetCents: 350, requiredCoinCount: 3, solutionCoins: [200, 100, 50], emoji: '🫒' },
  { name: 'Una tableta de chocolate', priceLabel: '1,70 €', targetCents: 170, requiredCoinCount: 3, solutionCoins: [100, 50, 20], emoji: '🍫' },
  { name: 'Una magdalena artesana', priceLabel: '1,30 €', targetCents: 130, requiredCoinCount: 3, solutionCoins: [100, 20, 10], emoji: '🧁' },
  { name: 'Una barra de mantequilla', priceLabel: '2,20 €', targetCents: 220, requiredCoinCount: 3, solutionCoins: [100, 100, 20], emoji: '🧈' },
  { name: 'Un paquete de rosquillas', priceLabel: '2,50 €', targetCents: 250, requiredCoinCount: 3, solutionCoins: [100, 100, 50], emoji: '🍩' },
  { name: 'Un cuaderno y un bolígrafo', priceLabel: '3,20 €', targetCents: 320, requiredCoinCount: 3, solutionCoins: [200, 100, 20], emoji: '✏️' },
  { name: 'Un bote de miel artesanal', priceLabel: '4,50 €', targetCents: 450, requiredCoinCount: 3, solutionCoins: [200, 200, 50], emoji: '🍯' },
  { name: 'Dos paquetes de arroz', priceLabel: '2,10 €', targetCents: 210, requiredCoinCount: 3, solutionCoins: [100, 100, 10], emoji: '🌾' },
]

const ROUND_3_ITEMS: ItemDefinition[] = [
  { name: 'Merienda de café y tarta', priceLabel: '2,80 €', targetCents: 280, requiredCoinCount: 4, solutionCoins: [200, 50, 20, 10], emoji: '🍰' },
  { name: 'Una cuña de queso curado', priceLabel: '3,70 €', targetCents: 370, requiredCoinCount: 4, solutionCoins: [200, 100, 50, 20], emoji: '🧀' },
  { name: 'Un kilo de fruta variada', priceLabel: '2,30 €', targetCents: 230, requiredCoinCount: 4, solutionCoins: [100, 100, 20, 10], emoji: '🍇' },
  { name: 'Un tarro de mermelada casera', priceLabel: '1,80 €', targetCents: 180, requiredCoinCount: 4, solutionCoins: [100, 50, 20, 10], emoji: '🍓' },
  { name: 'Pan con embutido ibérico', priceLabel: '3,60 €', targetCents: 360, requiredCoinCount: 4, solutionCoins: [200, 100, 50, 10], emoji: '🥪' },
  { name: 'Paquete de café tostado', priceLabel: '2,75 €', targetCents: 275, requiredCoinCount: 4, solutionCoins: [200, 50, 20, 5], emoji: '☕' },
  { name: 'Caja de infusiones relajantes', priceLabel: '2,60 €', targetCents: 260, requiredCoinCount: 4, solutionCoins: [100, 100, 50, 10], emoji: '🫖' },
  { name: 'Gel de baño familiar', priceLabel: '2,40 €', targetCents: 240, requiredCoinCount: 4, solutionCoins: [100, 100, 20, 20], emoji: '🧴' },
  { name: 'Un ramillete de claveles', priceLabel: '4,70 €', targetCents: 470, requiredCoinCount: 4, solutionCoins: [200, 200, 50, 20], emoji: '💐' },
  { name: 'Un libro de lectura de bolsillo', priceLabel: '5,50 €', targetCents: 550, requiredCoinCount: 4, solutionCoins: [200, 200, 100, 50], emoji: '📚' },
  { name: 'Caja de galletas surtidas', priceLabel: '3,20 €', targetCents: 320, requiredCoinCount: 4, solutionCoins: [200, 100, 10, 10], emoji: '🍪' },
  { name: 'Dos litros de leche y pan', priceLabel: '3,50 €', targetCents: 350, requiredCoinCount: 4, solutionCoins: [100, 100, 100, 50], emoji: '🥛' },
]

const ROUND_4_ITEMS: ItemDefinition[] = [
  { name: 'Una caja de pastas caseras', priceLabel: '3,80 €', targetCents: 380, requiredCoinCount: 5, solutionCoins: [200, 100, 50, 20, 10], emoji: '🧁' },
  { name: 'Desayuno con tostada, café y zumo', priceLabel: '3,75 €', targetCents: 375, requiredCoinCount: 5, solutionCoins: [200, 100, 50, 20, 5], emoji: '🥞' },
  { name: 'Cesta de fruta y miel', priceLabel: '4,70 €', targetCents: 470, requiredCoinCount: 5, solutionCoins: [200, 200, 50, 10, 10], emoji: '🧺' },
  { name: 'Un paraguas plegable', priceLabel: '4,80 €', targetCents: 480, requiredCoinCount: 5, solutionCoins: [200, 200, 50, 20, 10], emoji: '☂️' },
  { name: 'Caja de bombones finos', priceLabel: '5,60 €', targetCents: 560, requiredCoinCount: 5, solutionCoins: [200, 200, 100, 50, 10], emoji: '🍬' },
  { name: 'Un ramo de flores frescas', priceLabel: '3,90 €', targetCents: 390, requiredCoinCount: 5, solutionCoins: [200, 100, 50, 20, 20], emoji: '🌸' },
  { name: 'Pack completo de merienda', priceLabel: '2,80 €', targetCents: 280, requiredCoinCount: 5, solutionCoins: [100, 100, 50, 20, 10], emoji: '🥐' },
  { name: 'Revista, bolígrafo y caramelos', priceLabel: '3,35 €', targetCents: 335, requiredCoinCount: 5, solutionCoins: [200, 100, 20, 10, 5], emoji: '🍭' },
  { name: 'Tarro grande de miel y nueces', priceLabel: '4,30 €', targetCents: 430, requiredCoinCount: 5, solutionCoins: [200, 100, 100, 20, 10], emoji: '🍯' },
  { name: 'Cesta de verduras de la huerta', priceLabel: '5,70 €', targetCents: 570, requiredCoinCount: 5, solutionCoins: [200, 200, 100, 50, 20], emoji: '🥬' },
]

const ALL_ROUNDS_CATALOGS = [ROUND_1_ITEMS, ROUND_2_ITEMS, ROUND_3_ITEMS, ROUND_4_ITEMS]

const POSSIBLE_COIN_VALUES = [200, 100, 50, 20, 10, 5]

function getCoinMeta(valueCents: number): { label: string; type: CoinInstance['type'] } {
  switch (valueCents) {
    case 200:
      return { label: '2 €', type: '2e' }
    case 100:
      return { label: '1 €', type: '1e' }
    case 50:
      return { label: '50 c', type: '50c' }
    case 20:
      return { label: '20 c', type: '20c' }
    case 10:
      return { label: '10 c', type: '10c' }
    case 5:
    default:
      return { label: '5 c', type: '5c' }
  }
}

function formatCents(cents: number): string {
  const euros = (cents / 100).toFixed(2).replace('.', ',')
  return `${euros} €`
}

function generateInitialItems(): ItemDefinition[] {
  return ALL_ROUNDS_CATALOGS.map((pool) => {
    const randomIndex = Math.floor(Math.random() * pool.length)
    return pool[randomIndex]
  })
}

// Generates exactly 10 coins containing the solution coins heavily shuffled with distractors
function buildTenCoinsTable(item: ItemDefinition): CoinInstance[] {
  const coins: CoinInstance[] = []

  // 1. Add guaranteed solution coins
  item.solutionCoins.forEach((val, i) => {
    const meta = getCoinMeta(val)
    coins.push({
      instanceId: `sol-${i}-${val}`,
      valueCents: val,
      label: meta.label,
      type: meta.type,
    })
  })

  // 2. Add distractor coins until we have exactly 10 coins
  const distractorsNeeded = 10 - coins.length
  for (let i = 0; i < distractorsNeeded; i++) {
    const randomVal = POSSIBLE_COIN_VALUES[Math.floor(Math.random() * POSSIBLE_COIN_VALUES.length)]
    const meta = getCoinMeta(randomVal)
    coins.push({
      instanceId: `dist-${i}-${randomVal}-${Math.random()}`,
      valueCents: randomVal,
      label: meta.label,
      type: meta.type,
    })
  }

  // 3. Heavily shuffle multiple passes (Fisher-Yates) to completely randomize positions
  for (let pass = 0; pass < 3; pass++) {
    for (let i = coins.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = coins[i]
      coins[i] = coins[j]
      coins[j] = temp
    }
  }

  return coins
}

export function DailyCoins({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0) // 0 to 3 (4 rounds: 2, 3, 4, 5 coins)
  const [sessionItems, setSessionItems] = useState<ItemDefinition[]>(generateInitialItems)
  const [tableCoins, setTableCoins] = useState<CoinInstance[]>([])
  const [selectedCoins, setSelectedCoins] = useState<CoinInstance[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  // Initialize round and table coins
  useEffect(() => {
    const currentItem = sessionItems[roundIdx] || sessionItems[0]
    const tenCoins = buildTenCoinsTable(currentItem)
    setTableCoins(tenCoins)
    setSelectedCoins([])
    setFeedback('')
    setIsSuccess(false)
    isAdvancingRef.current = false

    // Clean voice narration with 250ms delay ensuring DOM ready and browser audio unlocked
    const timer = setTimeout(() => {
      speech.speak(
        `${currentItem.name}. Cuesta ${currentItem.priceLabel}. Junta exactamente ${currentItem.requiredCoinCount} monedas para pagar el total.`
      )
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, sessionItems])

  const currentItem = sessionItems[roundIdx] || sessionItems[0]
  const currentTotalCents = selectedCoins.reduce((acc, c) => acc + c.valueCents, 0)
  const currentCoinCount = selectedCoins.length

  const handleSelectCoin = (coin: CoinInstance) => {
    if (isAdvancingRef.current) return

    // If coin is already in selectedCoins, return it to the table
    if (selectedCoins.some((c) => c.instanceId === coin.instanceId)) {
      handleRemoveCoin(coin.instanceId)
      return
    }

    // Limit maximum coins to required count
    if (selectedCoins.length >= currentItem.requiredCoinCount) {
      sound.playGentleRetry()
      setFeedback(
        `Ya tienes ${currentItem.requiredCoinCount} monedas en el mostrador. Pulsa una moneda del mostrador para quitarla o 'Borrar todo'.`
      )
      speech.speak(`Ya tienes ${currentItem.requiredCoinCount} monedas. Toca una moneda de arriba si quieres cambiarla.`)
      return
    }

    sound.playTap()
    const newSelected = [...selectedCoins, coin]
    setSelectedCoins(newSelected)

    const newTotal = currentTotalCents + coin.valueCents

    // Check completion condition
    if (newTotal === currentItem.targetCents && newSelected.length === currentItem.requiredCoinCount) {
      // Perfect match!
      isAdvancingRef.current = true
      sound.playSuccess()
      const praise = pickRandom(DAILY_COINS_VOICES.correct)(currentItem.priceLabel)
      setFeedback(praise)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (roundIdx + 1 < sessionItems.length) {
            setRoundIdx((prev) => prev + 1)
          } else {
            setIsSuccess(true)
            onComplete()
          }
        }, 500)
      }

      const praiseDuration = speech.estimateDurationMs(praise)
      speech.speak(praise, advance)
      setTimeout(advance, praiseDuration + 2500)
    } else if (newTotal > currentItem.targetCents) {
      sound.playGentleRetry()
      setFeedback(
        `Te has pasado de importe (${formatCents(newTotal)}). Quita alguna moneda del mostrador para corregir.`
      )
      const overMsg = pickRandom(DAILY_COINS_VOICES.overLimit)
      speech.speak(overMsg)
    } else if (newSelected.length === currentItem.requiredCoinCount && newTotal !== currentItem.targetCents) {
      sound.playGentleRetry()
      setFeedback(
        `Tienes ${newSelected.length} monedas pero suman ${formatCents(newTotal)} en vez de ${currentItem.priceLabel}. Quita una para probar otra.`
      )
      const wrongMsg = pickRandom(DAILY_COINS_VOICES.wrongSum)
      speech.speak(wrongMsg)
    } else {
      const remaining = currentItem.targetCents - newTotal
      setFeedback(
        `Llevas ${formatCents(newTotal)} (${newSelected.length} de ${currentItem.requiredCoinCount} monedas). Faltan ${formatCents(remaining)}.`
      )
    }
  }

  const handleRemoveCoin = (instanceId: string) => {
    if (isAdvancingRef.current) return
    sound.playTap()
    setSelectedCoins((prev) => prev.filter((c) => c.instanceId !== instanceId))
    setFeedback('')
  }

  const handleResetCoins = () => {
    if (isAdvancingRef.current) return
    sound.playTap()
    setSelectedCoins([])
    setFeedback('')
    const resetMsg = pickRandom(DAILY_COINS_VOICES.coinsReset)
    speech.speak(resetMsg)
  }

  const handleRestartGame = () => {
    const fresh = generateInitialItems()
    setSessionItems(fresh)
    setRoundIdx(0)
    setIsSuccess(false)
  }

  // Realistic visual styling for Euro coins with maximum size and high contrast
  const getCoinVisual = (coin: CoinInstance, isTaken: boolean) => {
    const baseClasses =
      'relative flex flex-row items-center justify-start sm:justify-center gap-2 sm:gap-4 rounded-2xl sm:rounded-3xl font-black select-none transition-all duration-200 cursor-pointer shadow-sm sm:shadow-md px-2 sm:px-4 py-1 overflow-hidden'

    if (isTaken) {
      return (
        <div className="w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 border-dashed border-stone-300 bg-stone-100 flex flex-row items-center justify-center gap-2 text-stone-400 px-2 overflow-hidden">
          <span className="text-xl sm:text-3xl md:text-4xl font-black">✓ Puesta:</span>
          <span className="text-2xl sm:text-4xl md:text-5xl font-black opacity-75 shrink-0">{coin.label}</span>
        </div>
      )
    }

    switch (coin.type) {
      case '2e':
        return (
          <div
            className={`${baseClasses} w-full h-full min-h-0 bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400 border-3 sm:border-4 border-amber-500 hover:border-amber-600 active:scale-95`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-4 sm:border-[5px] border-amber-600 ring-3 sm:ring-4 ring-stone-300 flex items-center justify-center shadow-md">
              <span className="text-amber-950 text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none">
                2€
              </span>
            </div>
            <div className="flex flex-col items-start text-left leading-[0.95] min-w-0">
              <span className="text-stone-950 font-black text-2xl sm:text-4xl md:text-5xl">2 Euros</span>
            </div>
          </div>
        )
      case '1e':
        return (
          <div
            className={`${baseClasses} w-full h-full min-h-0 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border-3 sm:border-4 border-stone-400 hover:border-stone-600 active:scale-95`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gradient-to-br from-stone-100 to-stone-300 border-4 sm:border-[5px] border-stone-500 ring-3 sm:ring-4 ring-amber-400 flex items-center justify-center shadow-md">
              <span className="text-stone-900 text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none">
                1€
              </span>
            </div>
            <div className="flex flex-col items-start text-left leading-[0.95] min-w-0">
              <span className="text-amber-950 font-black text-2xl sm:text-4xl md:text-5xl">1 Euro</span>
            </div>
          </div>
        )
      case '50c':
        return (
          <div
            className={`${baseClasses} w-full h-full min-h-0 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border-3 sm:border-4 border-amber-600 hover:border-amber-700 active:scale-95`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border-4 sm:border-[5px] border-amber-600 flex items-center justify-center shadow-md">
              <span className="text-amber-950 text-xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none">
                50c
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline items-start text-left leading-[0.9] sm:gap-2 min-w-0">
              <span className="text-amber-950 font-black text-2xl sm:text-4xl md:text-5xl">50</span>
              <span className="text-amber-950 font-black text-lg sm:text-3xl md:text-4xl">céntimos</span>
            </div>
          </div>
        )
      case '20c':
        return (
          <div
            className={`${baseClasses} w-full h-full min-h-0 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border-3 sm:border-4 border-amber-500 hover:border-amber-600 active:scale-95`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border-4 sm:border-[5px] border-amber-500 flex items-center justify-center shadow-md">
              <span className="text-amber-950 text-xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none">
                20c
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline items-start text-left leading-[0.9] sm:gap-2 min-w-0">
              <span className="text-amber-950 font-black text-2xl sm:text-4xl md:text-5xl">20</span>
              <span className="text-amber-950 font-black text-lg sm:text-3xl md:text-4xl">céntimos</span>
            </div>
          </div>
        )
      case '10c':
        return (
          <div
            className={`${baseClasses} w-full h-full min-h-0 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border-3 sm:border-4 border-amber-500 hover:border-amber-600 active:scale-95`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border-4 sm:border-[5px] border-amber-500 flex items-center justify-center shadow-md">
              <span className="text-amber-950 text-xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none">
                10c
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline items-start text-left leading-[0.9] sm:gap-2 min-w-0">
              <span className="text-amber-950 font-black text-2xl sm:text-4xl md:text-5xl">10</span>
              <span className="text-amber-950 font-black text-lg sm:text-3xl md:text-4xl">céntimos</span>
            </div>
          </div>
        )
      case '5c':
      default:
        return (
          <div
            className={`${baseClasses} w-full h-full min-h-0 bg-gradient-to-br from-orange-200 via-orange-300 to-orange-400 border-3 sm:border-4 border-orange-700 hover:border-orange-800 active:scale-95`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-orange-300 border-4 sm:border-[5px] border-orange-600 flex items-center justify-center shadow-md">
              <span className="text-orange-950 text-xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none">
                5c
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline items-start text-left leading-[0.9] sm:gap-2 min-w-0">
              <span className="text-orange-950 font-black text-2xl sm:text-4xl md:text-5xl">5</span>
              <span className="text-orange-950 font-black text-lg sm:text-3xl md:text-4xl">céntimos</span>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-lime-400 rounded-2xl sm:rounded-3xl p-1.5 sm:p-4 shadow-md text-center min-h-0 overflow-hidden">
        {/* Compact Top Section: Article + Round + Goal Price */}
        <div className="flex flex-col gap-1 sm:gap-2 shrink-0">
          {/* Article title, emoji & round pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-4xl sm:text-6xl shrink-0" aria-hidden="true">
                {currentItem.emoji}
              </span>
              <h3 className="text-2xl sm:text-4xl font-black text-stone-950 leading-none text-left">
                {currentItem.name}
              </h3>
            </div>
            <span className="px-2.5 sm:px-4 py-1 bg-lime-100 border-2 border-lime-300 text-lime-950 font-black rounded-xl text-base sm:text-2xl shrink-0">
              Ronda {roundIdx + 1}/4
            </span>
          </div>

          {/* Goal badge + Tray combined concisely to maximize coin grid height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 items-stretch">
            {/* Goal badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-lime-100 border-2 sm:border-3 border-lime-400 text-lime-950 px-3 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl">
              <span className="text-lg sm:text-2xl font-extrabold">Total:</span>
              <span className="text-3xl sm:text-5xl font-black leading-none">{currentItem.priceLabel}</span>
              <span className="text-base sm:text-2xl font-black bg-white px-2.5 sm:px-3 py-0.5 rounded-lg border-2 border-lime-300 text-lime-900">
                con {currentItem.requiredCoinCount} monedas
              </span>
            </div>

            {/* The Tray (Mostrador de pago) */}
            <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-stone-100 border-2 sm:border-3 border-stone-300 flex flex-col justify-center gap-1 shadow-inner">
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="text-left flex items-center gap-1.5 sm:gap-2">
                  <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7 text-lime-700 stroke-[2.5] shrink-0" />
                  <span className="text-lg sm:text-2xl font-extrabold text-stone-700">Llevas:</span>
                  <span className="text-2xl sm:text-4xl font-black text-stone-950 leading-none">
                    {formatCents(currentTotalCents)}
                  </span>
                  <span className="text-base sm:text-2xl font-black text-stone-600">
                    ({currentCoinCount}/{currentItem.requiredCoinCount})
                  </span>
                </div>

                {selectedCoins.length > 0 && (
                  <button
                    onClick={handleResetCoins}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-base sm:text-xl rounded-lg sm:rounded-xl border-2 border-amber-400 cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
                    <span>Borrar</span>
                  </button>
                )}
              </div>

              {/* Visual coin chips on tray */}
              {selectedCoins.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center w-full pt-1 border-t border-stone-200">
                  {selectedCoins.map((coin) => (
                    <button
                      key={coin.instanceId}
                      onClick={() => handleRemoveCoin(coin.instanceId)}
                      className="px-3 sm:px-4 py-0.5 sm:py-1 bg-amber-200 hover:bg-rose-200 text-amber-950 hover:text-rose-950 rounded-full font-black text-lg sm:text-2xl border-2 border-amber-400 hover:border-rose-400 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Toca para quitar del mostrador"
                    >
                      <span>🪙 {coin.label}</span>
                      <span className="text-rose-600 font-black">✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-base sm:text-2xl my-1 animate-in fade-in shrink-0">
            {feedback}
          </div>
        )}

        {/* Table with ALWAYS 10 coins in 2 wide columns x 5 rows filling the screen */}
        <div className="grid grid-cols-2 grid-rows-5 gap-1.5 sm:gap-2.5 flex-1 min-h-0 w-full items-stretch mt-1 sm:mt-2">
          {tableCoins.map((coin) => {
            const isTaken = selectedCoins.some((c) => c.instanceId === coin.instanceId)
            return (
              <button
                key={coin.instanceId}
                onClick={() => handleSelectCoin(coin)}
                className={`w-full h-full min-h-0 rounded-2xl sm:rounded-3xl cursor-pointer transition-all active:scale-95 ${
                  isTaken ? 'opacity-70 cursor-pointer' : ''
                }`}
                title={isTaken ? 'Toca para devolver al mostrador' : `Añadir moneda de ${coin.label}`}
                aria-label={`Moneda de ${coin.label} ${isTaken ? '(seleccionada)' : ''}`}
              >
                {getCoinVisual(coin, isTaken)}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has superado las cuatro rondas juntando de 2 a 5 monedas con cuentas perfectas."
          onRestart={handleRestartGame}
          onHome={onExit}
        />
      )}
    </div>
  )
}
