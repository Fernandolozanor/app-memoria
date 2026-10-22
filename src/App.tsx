import { useState } from 'react'
import type { ActivityId } from './types'
import { ACTIVITIES } from './data/activities'
import { recordActivityCompletion } from './services/storage'
import { sound } from './services/sound'
import { speech } from './services/speech'
import { Header } from './components/Header'
import { ActivityCard } from './components/ActivityCard'

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

  const handleSelectActivity = (id: ActivityId) => {
    setCurrentActivity(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCompleteActivity = (id: ActivityId) => {
    recordActivityCompletion(id, 1)
  }

  const handleBackToMenu = () => {
    sound.playTap()
    speech.stop()
    setCurrentActivity(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeActivityMeta = ACTIVITIES.find((a) => a.id === currentActivity)

  return (
    <div className="h-[100dvh] flex flex-col bg-[#FDFBF7] text-stone-900 overflow-hidden select-none">
      {/* Simplified Header */}
      <Header
        title={activeActivityMeta ? activeActivityMeta.title : undefined}
        subtitle={activeActivityMeta ? activeActivityMeta.subtitle : undefined}
        onBack={currentActivity ? handleBackToMenu : undefined}
      />

      {/* Main Container - 100% full height zero-scroll on mobile, smoothly adaptable on tablet/desktop */}
      <main className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full px-2 sm:px-6 py-1.5 sm:py-4 overflow-hidden sm:overflow-y-auto">
        {!currentActivity ? (
          /* Catalog View - Super Clean, 100% full screen on mobile without scroll */
          <div className="flex-1 flex flex-col min-h-0 gap-2 sm:gap-3 overflow-hidden">
            {/* Direct Greeting Banner */}
            <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-50 rounded-xl sm:rounded-3xl py-2 px-3 sm:p-4 border-2 sm:border-3 border-amber-300 shadow-xs sm:shadow-md flex items-center justify-center text-center shrink-0">
              <h2 className="text-lg sm:text-3xl md:text-4xl font-black text-stone-950 leading-tight">
                ¿A qué jugamos hoy? 🌸
              </h2>
            </div>

            {/* Activities Grid - 2 columns, 5 rows, fills available screen space */}
            <div className="grid grid-cols-2 grid-rows-5 gap-2 sm:gap-3.5 flex-1 min-h-0 w-full">
              {ACTIVITIES.map((activity) => (
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
    </div>
  )
}
