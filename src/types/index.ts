export type ActivityId =
  // Primera tanda (1-10)
  | 'shopping-list'
  | 'memory-pairs'
  | 'sayings'
  | 'spot-object'
  | 'odd-one-out'
  | 'where-was-it'
  | 'sweet-piano'
  | 'step-order'
  | 'faces-and-names'
  | 'daily-coins'
  // Segunda tanda (11-20)
  | 'shell-game'
  | 'wall-clock'
  | 'popular-songs'
  | 'pack-suitcase'
  | 'home-phone'
  | 'four-seasons'
  | 'domino-match'
  | 'spain-journey'
  | 'syllable-words'
  | 'tidy-home'

export interface ActivityMeta {
  id: ActivityId
  batch: 1 | 2
  title: string
  subtitle: string
  category: 'Memoria' | 'Atención' | 'Lenguaje' | 'Lógica y Día a Día'
  iconName: string
  color: string // Tailwind color class for card
  bgColor: string
  borderColor: string
  description: string
}

export interface UserStats {
  completedActivities: Partial<Record<ActivityId, number>> // times played
  stars: number
  lastPlayedDate?: string
}
