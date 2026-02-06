import { create } from 'zustand'

export type ActivityType = 'status_change' | 'count_change' | 'error' | 'recovery'

export interface Activity {
  id: string
  pillar: string
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface ActivityFilterOptions {
  pillar?: string
  timeRange?: 'hour' | '24h' | '7d' | 'all'
  maxItems?: number
}

export interface HealthChange {
  status?: { from: string; to: string }
  count?: { from: number; to: number }
  error?: string
  recovery?: boolean
}

interface ActivityState {
  activities: Activity[]
  maxSize: number
  addActivity: (activity: Omit<Activity, 'id'>) => void
  clearActivities: () => void
  getFilteredActivities: (options: ActivityFilterOptions) => Activity[]
  addActivityFromHealthChange: (pillar: string, change: HealthChange) => void
}

function generateId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getTimeRangeMs(range: string | undefined): number {
  switch (range) {
    case 'hour':
      return 60 * 60 * 1000
    case '24h':
      return 24 * 60 * 60 * 1000
    case '7d':
      return 7 * 24 * 60 * 60 * 1000
    default:
      return Infinity
  }
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  maxSize: 1000,

  addActivity: (activity) =>
    set((state) => {
      const newActivity: Activity = {
        ...activity,
        id: generateId(),
      }
      const sorted = [newActivity, ...state.activities].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )
      return {
        activities: sorted.slice(0, state.maxSize),
      }
    }),

  clearActivities: () => set({ activities: [] }),

  getFilteredActivities: (options) => {
    const { pillar, timeRange, maxItems = 50 } = options
    const { activities } = get()
    const now = Date.now()
    const rangeMs = getTimeRangeMs(timeRange)

    let filtered = activities

    if (pillar) {
      filtered = filtered.filter((a) => a.pillar === pillar)
    }

    if (timeRange && timeRange !== 'all') {
      filtered = filtered.filter((a) => now - a.timestamp.getTime() <= rangeMs)
    }

    return filtered.slice(0, maxItems)
  },

  addActivityFromHealthChange: (pillar, change) => {
    const { addActivity } = get()

    if (change.status) {
      addActivity({
        pillar,
        type: 'status_change',
        description: `${pillar} status changed from ${change.status.from} to ${change.status.to}`,
        timestamp: new Date(),
        metadata: change.status,
      })
    }

    if (change.count) {
      const delta = change.count.to - change.count.from
      const direction = delta > 0 ? 'increased' : 'decreased'
      addActivity({
        pillar,
        type: 'count_change',
        description: `${pillar} count ${direction} by ${Math.abs(delta)} (${change.count.from} -> ${change.count.to})`,
        timestamp: new Date(),
        metadata: { delta, ...change.count },
      })
    }

    if (change.error) {
      addActivity({
        pillar,
        type: 'error',
        description: `${pillar} error: ${change.error}`,
        timestamp: new Date(),
        metadata: { error: change.error },
      })
    }

    if (change.recovery) {
      addActivity({
        pillar,
        type: 'recovery',
        description: `${pillar} recovered`,
        timestamp: new Date(),
        metadata: {},
      })
    }
  },
}))
