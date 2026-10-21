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
      className={`relative group bg-white rounded-xl sm:rounded-3xl p-1.5 sm:p-5 border-2 sm:border-4 ${activity.borderColor} shadow-xs sm:shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left cursor-pointer flex items-center justify-between gap-1 sm:gap-4 min-h-[50px] sm:min-h-[105px]`}>
      <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1">
        {/* Responsive icon */}
        <div
          className={`flex items-center justify-center w-8 h-8 sm:w-20 sm:h-20 rounded-lg sm:rounded-2xl bg-gradient-to-br ${activity.color} text-white shadow-xs sm:shadow-md shrink-0`}
        >
          <IconComponent className="w-4 h-4 sm:w-12 sm:h-12 stroke-[2.2]" />
        </div>

        {/* Big Bold Typography - Fully visible title, never truncated */}
        <div className="min-w-0 flex-1">
          <h2 className="text-[11px] sm:text-2xl md:text-3xl font-black text-stone-950 leading-tight break-words">
            {activity.title}
          </h2>
          <p className="hidden sm:block text-base sm:text-xl font-bold text-stone-600 mt-0.5 leading-snug">
            {activity.subtitle}
          </p>
        </div>
      </div>

      {/* Speaker icon button */}
      <button
        onClick={handleSpeech}
        className="p-1 sm:p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full transition-colors cursor-pointer shrink-0 border border-stone-300 sm:border-2"
        title="Escuchar nombre"
        aria-label={`Escuchar ${activity.title}`}
      >
        <Volume2 className="w-3.5 h-3.5 sm:w-7 sm:h-7 text-emerald-800 stroke-[2.5]" />
      </button>
    </div>
  )
}
