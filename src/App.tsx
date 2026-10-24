import { useState } from 'react'
import type { ActivityId } from './types'
import { ACTIVITIES } from './data/activities'
import { recordActivityCompletion } from './services/storage'
import { resetMistakes } from './services/sessionStats'
import { sound } from './services/sound'
import { speech } from './services/speech'
import { Header } from './components/Header'
import { ActivityCard } from './components/ActivityCard'

// Import Primera Tanda (1-10)
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

// Import Segunda Tanda (11-20)
import { ShellGame } from './activities/ShellGame'
import { WallClock } from './activities/WallClock'
import { PopularSongs } from './activities/PopularSongs'
import { PackSuitcase } from './activities/PackSuitcase'
import { HomePhone } from './activities/HomePhone'
import { FourSeasons } from './activities/FourSeasons'
import { DominoMatch } from './activities/DominoMatch'
import { SpainJourney } from './activities/SpainJourney'
import { SyllableWords } from './activities/SyllableWords'
import { TidyHome } from './activities/TidyHome'

export function App() {
  const params = new URLSearchParams(window.location.search)
  const initialActivity = (params.get('activity') as ActivityId) || null
  const initialBatch = params.get('tanda') === '2' ? 2 : 1
  const [currentActivity, setCurrentActivity] = useState<ActivityId | null>(initialActivity)
  const [activeBatch, setActiveBatch] = useState<1 | 2>(initialBatch)

  const handleSelectActivity = (id: ActivityId) => {
    const found = ACTIVITIES.find((a) => a.id === id)
    if (found) setActiveBatch(found.batch)
    resetMistakes()
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
  const visibleActivities = ACTIVITIES.filter((a) => a.batch === activeBatch)

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
            {/* Direct Greeting Banner + Tanda Selector */}
            <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-50 rounded-xl sm:rounded-3xl py-1.5 px-2.5 sm:p-3.5 border-2 sm:border-3 border-amber-300 shadow-xs sm:shadow-md flex flex-wrap items-center justify-between gap-2 shrink-0">
              <h2 className="text-lg sm:text-3xl font-black text-stone-950 leading-tight px-1">
                ¿A qué jugamos hoy? 🌸
              </h2>

              <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto">
                <button
                  onClick={() => {
                    sound.playTap()
                    setActiveBatch(1)
                  }}
                  className={`px-3 sm:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl border-2 sm:border-3 cursor-pointer transition-all active:scale-95 ${
                    activeBatch === 1
                      ? 'bg-amber-500 border-amber-700 text-white shadow-sm'
                      : 'bg-white hover:bg-amber-50 border-amber-300 text-stone-800'
                  }`}
                >
                  ⭐ 1ª Tanda
                </button>
                <button
                  onClick={() => {
                    sound.playTap()
                    setActiveBatch(2)
                  }}
                  className={`px-3 sm:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl border-2 sm:border-3 cursor-pointer transition-all active:scale-95 ${
                    activeBatch === 2
                      ? 'bg-emerald-600 border-emerald-800 text-white shadow-sm'
                      : 'bg-white hover:bg-emerald-50 border-emerald-300 text-stone-800'
                  }`}
                >
                  🌟 2ª Tanda
                </button>
              </div>
            </div>

            {/* Activities Grid - 2 columns, 5 rows, fills available screen space */}
            <div className="grid grid-cols-2 grid-rows-5 gap-2 sm:gap-3.5 flex-1 min-h-0 w-full">
              {visibleActivities.map((activity) => (
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

            {/* Segunda Tanda (11-20) */}
            {currentActivity === 'shell-game' && (
              <ShellGame
                onComplete={() => handleCompleteActivity('shell-game')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'wall-clock' && (
              <WallClock
                onComplete={() => handleCompleteActivity('wall-clock')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'popular-songs' && (
              <PopularSongs
                onComplete={() => handleCompleteActivity('popular-songs')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'pack-suitcase' && (
              <PackSuitcase
                onComplete={() => handleCompleteActivity('pack-suitcase')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'home-phone' && (
              <HomePhone
                onComplete={() => handleCompleteActivity('home-phone')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'four-seasons' && (
              <FourSeasons
                onComplete={() => handleCompleteActivity('four-seasons')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'domino-match' && (
              <DominoMatch
                onComplete={() => handleCompleteActivity('domino-match')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'spain-journey' && (
              <SpainJourney
                onComplete={() => handleCompleteActivity('spain-journey')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'syllable-words' && (
              <SyllableWords
                onComplete={() => handleCompleteActivity('syllable-words')}
                onExit={handleBackToMenu}
              />
            )}
            {currentActivity === 'tidy-home' && (
              <TidyHome
                onComplete={() => handleCompleteActivity('tidy-home')}
                onExit={handleBackToMenu}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
