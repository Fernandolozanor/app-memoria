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
} from 'lucide-react'
import type { ActivityMeta } from '../types'
import { sound } from '../services/sound'

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
      className={`relative group bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-5 border-2 sm:border-4 ${activity.borderColor} shadow-xs sm:shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left cursor-pointer flex items-center gap-2.5 sm:gap-5 h-full w-full min-h-0 overflow-hidden`}
    >
      {/* Large, generous tactile icon */}
      <div
        className={`flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br ${activity.color} text-white shadow-xs sm:shadow-md shrink-0`}
      >
        <IconComponent className="w-7 h-7 sm:w-12 sm:h-12 stroke-[2.4]" />
      </div>

      {/* Big Bold Typography with visible subtitle */}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <h2 className="text-sm sm:text-2xl md:text-3xl font-black text-stone-950 leading-tight line-clamp-2">
          {activity.title}
        </h2>
        <p className="text-xs sm:text-lg md:text-xl font-bold text-stone-600 mt-0.5 leading-snug line-clamp-2">
          {activity.subtitle}
        </p>
      </div>
    </div>
  )
}
