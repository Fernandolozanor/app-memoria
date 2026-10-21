import React from 'react'
import {
  ShoppingBasket,
  Sparkles,
  BookOpen,
  Search,
  HelpCircle,
  Home,
  Music,
  ListOrdered,
  Users,
  Coins,
  Volume2,
} from 'lucide-react'
import type { ActivityMeta } from '../types'
import { sound } from '../services/sound'
import { speech } from '../services/speech'

interface Props {
  activity: ActivityMeta
  onSelect: () => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBasket,
  Sparkles,
  BookOpen,
  Search,
  HelpCircle,
  Home,
  Music,
  ListOrdered,
  Users,
  Coins,
}

export function ActivityCard({ activity, onSelect }: Props) {
  const IconComponent = ICON_MAP[activity.iconName] || Sparkles

  const handleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playTap()
    speech.speak(`${activity.title}. ${activity.description}`)
  }

  const handleClick = () => {
    sound.playTap()
    onSelect()
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`relative group bg-white rounded-xl sm:rounded-3xl p-1.5 sm:p-4 border-2 sm:border-4 ${activity.borderColor} shadow-xs sm:shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left cursor-pointer flex items-center justify-between gap-1.5 sm:gap-4 h-full w-full min-h-0 overflow-hidden`}
    >
      <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1 h-full">
        {/* Generous tactile icon */}
        <div
          className={`flex items-center justify-center w-10 h-10 sm:w-18 sm:h-18 rounded-lg sm:rounded-2xl bg-gradient-to-br ${activity.color} text-white shadow-xs sm:shadow-md shrink-0`}
        >
          <IconComponent className="w-5 h-5 sm:w-10 sm:h-10 stroke-[2.2]" />
        </div>

        {/* Big Bold Typography with visible subtitle */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h2 className="text-xs sm:text-xl md:text-2xl font-black text-stone-950 leading-tight truncate">
            {activity.title}
          </h2>
          <p className="text-[10px] sm:text-sm md:text-base font-bold text-stone-600 mt-0.5 leading-tight line-clamp-1">
            {activity.subtitle}
          </p>
        </div>
      </div>

      {/* Speaker icon button */}
      <button
        onClick={handleSpeech}
        className="p-1 sm:p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg sm:rounded-2xl transition-all cursor-pointer shrink-0 border border-blue-200 sm:border-2 border-blue-300 shadow-xs active:scale-90"
        title="Escuchar nombre"
        aria-label={`Escuchar ${activity.title}`}
      >
        <Volume2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-700 stroke-[2.5]" />
      </button>
    </div>
  )
}
