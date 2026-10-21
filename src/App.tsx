import { useState } from 'react'
import type { ActivityId, UserStats } from './types'
import { ACTIVITIES } from './data/activities'
import {
  loadUserStats,
  recordActivityCompletion,
} from './services/storage'
import { sound } from './services/sound'
import { speech } from './services/speech'
import { Header } from './components/Header'
import { ActivityCard } from './components/ActivityCard'
import { SpeakerButton } from './components/SpeakerButton'
import { VoiceModal } from './components/VoiceModal'

// Import all 10 activities
import { ShoppingList } from './activities/ShoppingList'
import { MemoryPairs } from './activities/MemoryPairs'
import { Sayings } from './activities/Sayings'
import { SpotObject } from './activities/SpotObject'
import { OddOneOut } from './activities/OddOneOut'
import { WhereWasIt } from './activities/WhereWasIt'
import { SweetPiano } from './activities/SweetPiano'
import { StepOrder } from './activities/StepOrder'
import { FacesAndNames } from './activities/FacesAndNames'
import { DailyCoins } from './activities/DailyCoins'

export function App() {
  const initialActivity = (new URLSearchParams(window.location.search).get('activity') as ActivityId) || null
  const [currentActivity, setCurrentActivity] = useState<ActivityId | null>(initialActivity)
  const [stats, setStats] = useState<UserStats>(loadUserStats)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)

  const handleSelectActivity = (id: ActivityId) => {
    setCurrentActivity(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCompleteActivity = (id: ActivityId) => {
    const updated = recordActivityCompletion(id, 1)
    setStats(updated)
  }

  const handleBackToMenu = () => {
    sound.playTap()
    speech.stop()
    setCurrentActivity(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeActivityMeta = ACTIVITIES.find((a) => a.id === currentActivity)
  const categories = ['Todas', 'Memoria', 'Atención', 'Lenguaje', 'Lógica']

  const filteredActivities =
    selectedCategory === 'Todas'
      ? ACTIVITIES
      : ACTIVITIES.filter((a) => {
          if (selectedCategory === 'Lógica') return a.category.includes('Lógica')
          return a.category === selectedCategory
        })

  return (
    <div className="h-[100dvh] flex flex-col bg-[#FDFBF7] text-stone-900 overflow-hidden select-none">
      {/* Accessible Header */}
      <Header
        title={activeActivityMeta ? activeActivityMeta.title : 'Memoria'}
        subtitle={activeActivityMeta ? activeActivityMeta.subtitle : undefined}
        onBack={currentActivity ? handleBackToMenu : undefined}
        stars={stats.stars}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onReadHeader={() => {
          if (activeActivityMeta) {
            speech.speak(`${activeActivityMeta.title}. ${activeActivityMeta.description}`)
          } else {
            speech.speak('Menú de juegos. Toca cualquier actividad para empezar.')
          }
        }}
      />

      {/* Main Container - 100% full height zero-scroll on mobile, smoothly adaptable on tablet/desktop */}
      <main className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full px-2 sm:px-6 py-1 sm:py-4 overflow-hidden sm:overflow-y-auto">
        {!currentActivity ? (
          /* Catalog View - Super Clean, 100% full screen on mobile without scroll */
          <div className="flex-1 flex flex-col min-h-0 gap-1.5 sm:gap-3 overflow-hidden">
            {/* Direct Greeting Banner */}
            <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-50 rounded-xl sm:rounded-3xl p-1.5 sm:p-4 border-2 sm:border-3 border-amber-300 shadow-xs sm:shadow-md flex items-center justify-between gap-2 shrink-0">
              <div>
                <h2 className="text-base sm:text-3xl md:text-4xl font-black text-stone-950 leading-tight">
                  ¿A qué jugamos hoy? 🌸
                </h2>
                <p className="hidden sm:block text-lg sm:text-2xl font-bold text-stone-700 mt-1">
                  Toca una actividad para comenzar:
                </p>
              </div>

              <SpeakerButton
                text="¿A qué jugamos hoy? Toca cualquier recuadro de la pantalla para empezar a jugar."
                label="Escuchar"
                className="shrink-0"
              />
            </div>

            {/* Category Filter Pills - Spanning full width */}
            <div className="flex w-full gap-1 sm:gap-3 shrink-0">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playTap()
                      setSelectedCategory(cat)
                    }}
                    className={`flex-1 flex items-center justify-center py-1 sm:py-3 px-0.5 sm:px-2 rounded-lg sm:rounded-2xl font-black text-xs sm:text-xl border-2 sm:border-3 transition-all cursor-pointer min-h-[32px] sm:min-h-[50px] text-center ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-900 shadow-xs sm:shadow-md ring-2 sm:ring-4 ring-emerald-300/70'
                        : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50 hover:border-stone-400'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            {/* Activities Grid - 2 columns, fills available screen space, stretching cards to occupy the vertical space */}
            <div
              className={`grid grid-cols-2 ${
                filteredActivities.length >= 9
                  ? 'grid-rows-5'
                  : filteredActivities.length >= 7
                  ? 'grid-rows-4'
                  : filteredActivities.length >= 5
                  ? 'grid-rows-3'
                  : filteredActivities.length >= 3
                  ? 'grid-rows-2'
                  : 'grid-rows-1'
              } gap-1.5 sm:gap-3 flex-1 min-h-0 w-full`}
            >
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onSelect={() => handleSelectActivity(activity.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Active Activity View - Fills viewport with zero scroll */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full h-full">
            {currentActivity === 'shopping-list' && (
              <ShoppingList
                onComplete={() => handleCompleteActivity('shopping-list')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'memory-pairs' && (
              <MemoryPairs
                onComplete={() => handleCompleteActivity('memory-pairs')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'sayings' && (
              <Sayings
                onComplete={() => handleCompleteActivity('sayings')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'spot-object' && (
              <SpotObject
                onComplete={() => handleCompleteActivity('spot-object')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'odd-one-out' && (
              <OddOneOut
                onComplete={() => handleCompleteActivity('odd-one-out')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'where-was-it' && (
              <WhereWasIt
                onComplete={() => handleCompleteActivity('where-was-it')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'sweet-piano' && (
              <SweetPiano
                onComplete={() => handleCompleteActivity('sweet-piano')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'step-order' && (
              <StepOrder
                onComplete={() => handleCompleteActivity('step-order')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'faces-and-names' && (
              <FacesAndNames
                onComplete={() => handleCompleteActivity('faces-and-names')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'daily-coins' && (
              <DailyCoins
                onComplete={() => handleCompleteActivity('daily-coins')}
                onExit={handleBackToMenu}
              />
            )}
          </div>
        )}
      </main>

      {/* Voice Selection Modal */}
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />
    </div>
  )
}
