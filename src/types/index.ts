export type ActivityId =
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

export interface ActivityMeta {
  id: ActivityId
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
  completedActivities: Record<ActivityId, number> // times played
  stars: number
  lastPlayedDate?: string
}
