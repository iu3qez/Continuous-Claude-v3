import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActivityFeed } from '../ActivityFeed'
import * as activityStoreModule from '@/stores/activityStore'

const mockActivities: activityStoreModule.Activity[] = [
  {
    id: 'act-001',
    pillar: 'memory',
    type: 'status_change',
    description: 'Memory pillar went online',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    metadata: { from: 'offline', to: 'online' },
  },
  {
    id: 'act-002',
    pillar: 'knowledge',
    type: 'count_change',
    description: 'Knowledge base updated: 15 new entries',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    metadata: { delta: 15 },
  },
  {
    id: 'act-003',
    pillar: 'pageindex',
    type: 'error',
    description: 'PageIndex failed to sync',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    metadata: { error: 'Connection timeout' },
  },
  {
    id: 'act-004',
    pillar: 'roadmap',
    type: 'recovery',
    description: 'Roadmap recovered from degraded state',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
    metadata: {},
  },
  {
    id: 'act-005',
    pillar: 'handoffs',
    type: 'count_change',
    description: 'New handoff created',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    metadata: { handoff_id: 'h-123' },
  },
]

const mockGetFilteredActivities = vi.fn()

vi.mock('@/stores/activityStore', async (importOriginal) => {
  const actual = await importOriginal<typeof activityStoreModule>()
  return {
    ...actual,
    useActivityStore: vi.fn((selector) => {
      const state = {
        activities: mockActivities,
        addActivity: vi.fn(),
        clearActivities: vi.fn(),
        getFilteredActivities: mockGetFilteredActivities,
        addActivityFromHealthChange: vi.fn(),
        maxSize: 1000,
      }
      return selector(state)
    }),
  }
})

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFilteredActivities.mockReturnValue(mockActivities)
  })

  describe('Rendering', () => {
    it('renders activity feed with activities', () => {
      render(<ActivityFeed />)

      expect(screen.getByText('Activity Feed')).toBeInTheDocument()
      expect(screen.getByText('Memory pillar went online')).toBeInTheDocument()
      expect(screen.getByText('Knowledge base updated: 15 new entries')).toBeInTheDocument()
    })

    it('displays pillar names for each activity', () => {
      render(<ActivityFeed />)

      expect(screen.getByText('memory')).toBeInTheDocument()
      expect(screen.getByText('knowledge')).toBeInTheDocument()
      expect(screen.getByText('pageindex')).toBeInTheDocument()
    })

    it('shows activity type badges', () => {
      render(<ActivityFeed />)

      expect(screen.getByText('status_change')).toBeInTheDocument()
      const countChangeBadges = screen.getAllByText('count_change')
      expect(countChangeBadges.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('error')).toBeInTheDocument()
      expect(screen.getByText('recovery')).toBeInTheDocument()
    })

    it('displays relative timestamps', () => {
      render(<ActivityFeed />)

      expect(screen.getByText('5m ago')).toBeInTheDocument()
      expect(screen.getByText('30m ago')).toBeInTheDocument()
      expect(screen.getByText('2h ago')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<ActivityFeed className="custom-class" />)

      const container = screen.getByTestId('activity-feed')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no activities', () => {
      mockGetFilteredActivities.mockReturnValue([])

      render(<ActivityFeed />)

      expect(screen.getByText('No recent activity')).toBeInTheDocument()
      expect(
        screen.getByText('Activities will appear here as pillars are updated')
      ).toBeInTheDocument()
    })
  })

  describe('Pillar Filter', () => {
    it('renders pillar filter dropdown trigger', () => {
      render(<ActivityFeed />)

      expect(screen.getByRole('button', { name: /all pillars/i })).toBeInTheDocument()
    })

    it('calls getFilteredActivities with no pillar filter by default', () => {
      render(<ActivityFeed />)

      expect(mockGetFilteredActivities).toHaveBeenCalledWith(
        expect.objectContaining({ pillar: undefined })
      )
    })
  })

  describe('Time Range Filter', () => {
    it('renders time range filter trigger', () => {
      render(<ActivityFeed />)

      expect(screen.getByRole('button', { name: /all time/i })).toBeInTheDocument()
    })

    it('calls getFilteredActivities with "all" time range by default', () => {
      render(<ActivityFeed />)

      expect(mockGetFilteredActivities).toHaveBeenCalledWith(
        expect.objectContaining({ timeRange: 'all' })
      )
    })
  })

  describe('Type Badge Colors', () => {
    it('applies correct color for status_change type', () => {
      render(<ActivityFeed />)

      const badge = screen.getByText('status_change')
      expect(badge).toHaveClass('bg-blue-500/15')
    })

    it('applies correct color for error type', () => {
      render(<ActivityFeed />)

      const badge = screen.getByText('error')
      expect(badge).toHaveClass('bg-red-500/15')
    })

    it('applies correct color for recovery type', () => {
      render(<ActivityFeed />)

      const badge = screen.getByText('recovery')
      expect(badge).toHaveClass('bg-green-500/15')
    })

    it('applies correct color for count_change type', () => {
      render(<ActivityFeed />)

      const badges = screen.getAllByText('count_change')
      expect(badges[0]).toHaveClass('bg-purple-500/15')
    })
  })

  describe('Max Items', () => {
    it('limits displayed activities based on maxItems prop', () => {
      render(<ActivityFeed maxItems={10} />)

      expect(mockGetFilteredActivities).toHaveBeenCalledWith(
        expect.objectContaining({ maxItems: 10 })
      )
    })

    it('defaults to 50 max items', () => {
      render(<ActivityFeed />)

      expect(mockGetFilteredActivities).toHaveBeenCalledWith(
        expect.objectContaining({ maxItems: 50 })
      )
    })
  })

  describe('Scroll Area', () => {
    it('renders within a scroll area for long lists', () => {
      render(<ActivityFeed />)

      const scrollArea = screen.getByTestId('activity-scroll-area')
      expect(scrollArea).toBeInTheDocument()
    })
  })
})
