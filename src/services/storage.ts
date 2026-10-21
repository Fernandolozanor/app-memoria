import type { ActivityId, UserStats } from '../types'

const STORAGE_KEY = 'app_memoria_stats_v1'
const SETTINGS_KEY = 'app_memoria_settings_v1'

export interface AppSettings {
  autoSpeak: boolean
  largeText: boolean
  soundEffects: boolean
}

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Failed to load stats', e)
  }

  return {
    completedActivities: {
      'shopping-list': 0,
      'memory-pairs': 0,
      'sayings': 0,
      'spot-object': 0,
      'odd-one-out': 0,
      'where-was-it': 0,
      'sweet-piano': 0,
      'step-order': 0,
      'faces-and-names': 0,
      'daily-coins': 0,
    },
    stars: 0,
    lastPlayedDate: new Date().toISOString().split('T')[0],
  }
}

export function recordActivityCompletion(activityId: ActivityId, earnedStars = 1): UserStats {
  const stats = loadUserStats()
  stats.completedActivities[activityId] = (stats.completedActivities[activityId] || 0) + 1
  stats.stars += earnedStars
  stats.lastPlayedDate = new Date().toISOString().split('T')[0]

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('Failed to save stats', e)
  }

  return stats
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load settings', e)
  }

  return {
    autoSpeak: true,
    largeText: false,
    soundEffects: true,
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings', e)
  }
}
