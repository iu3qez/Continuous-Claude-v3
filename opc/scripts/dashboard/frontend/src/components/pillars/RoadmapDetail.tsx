import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { fetchRoadmapGoals } from '@/lib/api'
import type { RoadmapGoal, RoadmapResponse } from '@/types'

interface RoadmapDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SectionType = 'Current Focus' | 'Completed' | 'Planned'

const SECTION_ORDER: SectionType[] = ['Current Focus', 'Completed', 'Planned']

const SECTION_CONFIG: Record<SectionType, { variant: string; icon: string }> = {
  'Current Focus': {
    variant: 'bg-degraded/15 text-degraded border-degraded/30',
    icon: '◐',
  },
  'Completed': {
    variant: 'bg-online/15 text-online border-online/30',
    icon: '●',
  },
  'Planned': {
    variant: 'bg-muted text-muted-foreground border-muted',
    icon: '○',
  },
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-3 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className="h-full bg-online transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function GoalItem({ goal }: { goal: RoadmapGoal }) {
  return (
    <div
      data-completed={goal.completed}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
        goal.completed
          ? 'border-online/20 bg-online/5'
          : 'border-border bg-card hover:bg-muted/50'
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        {goal.completed ? (
          <svg
            className="h-5 w-5 text-online"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
          </svg>
        )}
      </div>
      <span
        className={cn(
          'text-sm',
          goal.completed && 'text-muted-foreground line-through'
        )}
      >
        {goal.text}
      </span>
    </div>
  )
}

function SectionHeader({ section, count }: { section: SectionType; count: number }) {
  const config = SECTION_CONFIG[section]
  return (
    <div className="flex items-center gap-2 pb-2">
      <Badge variant="outline" className={cn('text-xs', config.variant)}>
        <span className="mr-1">{config.icon}</span>
        {section}
      </Badge>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  )
}

export function RoadmapDetail({ open, onOpenChange }: RoadmapDetailProps) {
  const [data, setData] = useState<RoadmapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchRoadmapGoals()
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadGoals()
    }
  }, [open, loadGoals])

  const groupedGoals = useMemo(() => {
    if (!data) return {}

    const groups: Record<string, RoadmapGoal[]> = {}
    for (const goal of data.goals) {
      const section = goal.section || 'Planned'
      if (!groups[section]) {
        groups[section] = []
      }
      groups[section].push(goal)
    }
    return groups
  }, [data])

  const progressPercent = data ? Math.round(data.completion_rate) : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Roadmap Goals
          </SheetTitle>
          <SheetDescription>Track project progress and milestones</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <svg
                className="mx-auto h-8 w-8 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="mt-2 text-sm">Loading goals...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-offline">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="mt-2 text-sm">Failed to load goals</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-lg font-bold text-online">{progressPercent}%</span>
                </div>
                <ProgressBar value={progressPercent} />
                <p className="text-center text-xs text-muted-foreground">
                  {data.completed} of {data.total} goals completed
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-degraded/10 p-2 text-center">
                  <div className="text-lg font-bold text-degraded">
                    {groupedGoals['Current Focus']?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="rounded-lg bg-online/10 p-2 text-center">
                  <div className="text-lg font-bold text-online">{data.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="rounded-lg bg-muted p-2 text-center">
                  <div className="text-lg font-bold text-muted-foreground">
                    {groupedGoals['Planned']?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Planned</div>
                </div>
              </div>
            </div>

            <ScrollArea className="mt-4 h-[calc(100vh-380px)]">
              {data.goals.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-2 text-sm">No goals found</p>
                  <p className="text-xs">Add goals to your roadmap to track progress</p>
                </div>
              ) : (
                <div className="space-y-6 pr-4">
                  {SECTION_ORDER.map((section) => {
                    const goals = groupedGoals[section]
                    if (!goals || goals.length === 0) return null

                    return (
                      <div key={section}>
                        <SectionHeader section={section} count={goals.length} />
                        <div className="space-y-2">
                          {goals.map((goal) => (
                            <GoalItem key={goal.id} goal={goal} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
