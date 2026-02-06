import { describe, it, expect, beforeEach } from 'vitest'
import { useActivityStore, Activity } from '../activityStore'
import { act } from '@testing-library/react'

describe('activityStore', () => {
  beforeEach(() => {
    const { clearActivities } = useActivityStore.getState()
    clearActivities()
  })

  describe('addActivity', () => {
    it('adds an activity to the store', () => {
      const { addActivity } = useActivityStore.getState()

      const activity: Omit<Activity, 'id'> = {
        pillar: 'memory',
        type: 'status_change',
        description: 'Memory went online',
        timestamp: new Date(),
      }

      act(() => {
        addActivity(activity)
      })

      const state = useActivityStore.getState()
      expect(state.activities).toHaveLength(1)
      expect(state.activities[0].pillar).toBe('memory')
      expect(state.activities[0].id).toBeDefined()
    })

    it('adds activities in chronological order (newest first)', () => {
      const { addActivity } = useActivityStore.getState()

      act(() => {
        addActivity({
          pillar: 'memory',
          type: 'status_change',
          description: 'First activity',
          timestamp: new Date(Date.now() - 60000),
        })
        addActivity({
          pillar: 'knowledge',
          type: 'count_change',
          description: 'Second activity',
          timestamp: new Date(),
        })
      })

      const state = useActivityStore.getState()
      expect(state.activities[0].description).toBe('Second activity')
      expect(state.activities[1].description).toBe('First activity')
    })

    it('limits activities to maxSize (default 1000)', () => {
      const { addActivity } = useActivityStore.getState()

      act(() => {
        for (let i = 0; i < 1050; i++) {
          addActivity({
            pillar: 'memory',
            type: 'status_change',
            description: `Activity ${i}`,
            timestamp: new Date(Date.now() - i * 1000),
          })
        }
      })

      const state = useActivityStore.getState()
      expect(state.activities.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('clearActivities', () => {
    it('removes all activities', () => {
      const { addActivity, clearActivities } = useActivityStore.getState()

      act(() => {
        addActivity({
          pillar: 'memory',
          type: 'status_change',
          description: 'Test',
          timestamp: new Date(),
        })
        clearActivities()
      })

      const state = useActivityStore.getState()
      expect(state.activities).toHaveLength(0)
    })
  })

  describe('getFilteredActivities', () => {
    beforeEach(() => {
      const { addActivity } = useActivityStore.getState()

      act(() => {
        addActivity({
          pillar: 'memory',
          type: 'status_change',
          description: 'Memory status',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        })
        addActivity({
          pillar: 'knowledge',
          type: 'error',
          description: 'Knowledge error',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        })
        addActivity({
          pillar: 'memory',
          type: 'recovery',
          description: 'Memory recovered',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        })
        addActivity({
          pillar: 'pageindex',
          type: 'count_change',
          description: 'PageIndex updated',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        })
      })
    })

    it('filters by pillar', () => {
      const { getFilteredActivities } = useActivityStore.getState()

      const result = getFilteredActivities({ pillar: 'memory' })

      expect(result).toHaveLength(2)
      expect(result.every(a => a.pillar === 'memory')).toBe(true)
    })

    it('filters by time range - hour', () => {
      const { getFilteredActivities } = useActivityStore.getState()

      const result = getFilteredActivities({ timeRange: 'hour' })

      expect(result).toHaveLength(2) // 30min and 5min ago
      result.forEach(a => {
        const diffMs = Date.now() - a.timestamp.getTime()
        expect(diffMs).toBeLessThanOrEqual(60 * 60 * 1000)
      })
    })

    it('filters by time range - 24h', () => {
      const { getFilteredActivities } = useActivityStore.getState()

      const result = getFilteredActivities({ timeRange: '24h' })

      expect(result).toHaveLength(3) // excludes 2 days ago
    })

    it('filters by time range - 7d', () => {
      const { getFilteredActivities } = useActivityStore.getState()

      const result = getFilteredActivities({ timeRange: '7d' })

      expect(result).toHaveLength(4) // all activities
    })

    it('respects maxItems limit', () => {
      const { getFilteredActivities } = useActivityStore.getState()

      const result = getFilteredActivities({ maxItems: 2 })

      expect(result).toHaveLength(2)
    })

    it('combines multiple filters', () => {
      const { getFilteredActivities } = useActivityStore.getState()

      const result = getFilteredActivities({
        pillar: 'memory',
        timeRange: 'hour',
        maxItems: 1,
      })

      expect(result).toHaveLength(1)
      expect(result[0].pillar).toBe('memory')
    })

    it('returns all activities when no filters', () => {
      const { getFilteredActivities } = useActivityStore.getState()

      const result = getFilteredActivities({})

      expect(result).toHaveLength(4)
    })
  })

  describe('addActivityFromHealthChange', () => {
    it('creates activity from pillar status change', () => {
      const { addActivityFromHealthChange } = useActivityStore.getState()

      act(() => {
        addActivityFromHealthChange('memory', {
          status: { from: 'offline', to: 'online' },
        })
      })

      const state = useActivityStore.getState()
      expect(state.activities).toHaveLength(1)
      expect(state.activities[0].type).toBe('status_change')
      expect(state.activities[0].description).toContain('offline')
      expect(state.activities[0].description).toContain('online')
    })

    it('creates activity from count change', () => {
      const { addActivityFromHealthChange } = useActivityStore.getState()

      act(() => {
        addActivityFromHealthChange('knowledge', {
          count: { from: 10, to: 25 },
        })
      })

      const state = useActivityStore.getState()
      expect(state.activities).toHaveLength(1)
      expect(state.activities[0].type).toBe('count_change')
      expect(state.activities[0].description).toContain('15')
    })

    it('creates error activity', () => {
      const { addActivityFromHealthChange } = useActivityStore.getState()

      act(() => {
        addActivityFromHealthChange('pageindex', {
          error: 'Connection failed',
        })
      })

      const state = useActivityStore.getState()
      expect(state.activities).toHaveLength(1)
      expect(state.activities[0].type).toBe('error')
      expect(state.activities[0].description).toContain('Connection failed')
    })

    it('creates recovery activity when error clears', () => {
      const { addActivityFromHealthChange } = useActivityStore.getState()

      act(() => {
        addActivityFromHealthChange('roadmap', {
          recovery: true,
        })
      })

      const state = useActivityStore.getState()
      expect(state.activities).toHaveLength(1)
      expect(state.activities[0].type).toBe('recovery')
    })
  })
})
