import { useEffect, useCallback, useRef, useState } from 'react'
import { toast, Toaster } from 'sonner'
import { Header } from '@/components/layout/Header'
import { PillarGrid } from '@/components/pillars/PillarGrid'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { fetchHealth } from '@/lib/api'
import { showPillarStatusToast } from '@/lib/toast'
import { useHealthStore } from '@/stores/healthStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { HealthResponse, PillarHealth } from '@/types'
import { useBrowserNotifications } from '@/hooks'
import { MemoryDetail } from '@/components/pillars/MemoryDetail'
import { KnowledgeDetail } from '@/components/pillars/KnowledgeDetail'
import { PageIndexDetail } from '@/components/pillars/PageIndexDetail'
import { RoadmapDetail } from '@/components/pillars/RoadmapDetail'
import { HandoffsDetail } from '@/components/pillars/HandoffsDetail'
import './index.css'

function App() {
  const { pillars, isLoading, error, lastUpdated, setHealth, setError, setLoading } = useHealthStore()
  const { addNotification } = useNotificationStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeDetail, setActiveDetail] = useState<string | null>(null)
  const { notifyOffline } = useBrowserNotifications()

  const previousPillarsRef = useRef<Record<string, PillarHealth>>({})

  const handleHealthUpdate = useCallback((data: HealthResponse) => {
    Object.entries(data.pillars).forEach(([name, health]) => {
      const previous = previousPillarsRef.current[name]
      if (previous && previous.status !== health.status) {
        showPillarStatusToast(name, health.status, previous.status)

        addNotification({
          type: health.status === 'offline' ? 'error' :
                health.status === 'degraded' ? 'warning' : 'success',
          title: `${name} Status Changed`,
          message: `${previous.status} -> ${health.status}`,
          pillar: name,
        })

        if (health.status === 'offline') {
          notifyOffline(name)
        }
      }
    })

    setHealth(data)
    previousPillarsRef.current = data.pillars
  }, [setHealth, addNotification, notifyOffline])

  const { isConnected } = useWebSocket({
    project: 'continuous-claude',
    onHealthUpdate: handleHealthUpdate,
  })

  const loadHealth = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const data = await fetchHealth()
      setHealth(data)
      previousPillarsRef.current = data.pillars
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data')
    } finally {
      setLoading(false)
      setTimeout(() => setIsRefreshing(false), 300)
    }
  }, [setHealth, setError, setLoading])

  useEffect(() => {
    loadHealth()

    const interval = setInterval(loadHealth, 10000)
    return () => clearInterval(interval)
  }, [loadHealth])

  const handleViewDetails = (pillar: string) => {
    setActiveDetail(pillar)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header isConnected={isConnected} />

      <main className="container max-w-screen-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Status</h2>
            <p className="text-sm text-muted-foreground">
              Monitor the 5 pillars of Continuous Claude
            </p>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <div className={isRefreshing && !isLoading ? 'opacity-70 transition-opacity duration-200' : 'transition-opacity duration-300'}>
          <PillarGrid health={Object.keys(pillars).length > 0 ? { pillars } : null} isLoading={isLoading} onViewDetails={handleViewDetails} />
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => {
                const healthSummary = Object.entries(pillars)
                  .map(([name, health]) => `${name}: ${health.status}`)
                  .join(', ')
                toast.success(`Health: ${healthSummary}`)
              }}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Health API</p>
                <p className="text-xs text-muted-foreground">View raw JSON</p>
              </div>
              <svg className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setActiveDetail('memory')}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Browse Learnings</p>
                <p className="text-xs text-muted-foreground">Memory API</p>
              </div>
              <svg className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setActiveDetail('roadmap')}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Roadmap Goals</p>
                <p className="text-xs text-muted-foreground">Progress tracker</p>
              </div>
              <svg className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setActiveDetail('handoffs')}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10 text-chart-5">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Handoff Documents</p>
                <p className="text-xs text-muted-foreground">Session transfers</p>
              </div>
              <svg className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <div className="container max-w-screen-2xl px-4">
          <p className="text-center text-xs text-muted-foreground">
            Session Dashboard v1.0 | Backend: FastAPI | Frontend: React + shadcn/ui
          </p>
        </div>
      </footer>

      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
      />

      <MemoryDetail
        open={activeDetail === 'memory'}
        onOpenChange={(open) => !open && setActiveDetail(null)}
      />
      <KnowledgeDetail
        open={activeDetail === 'knowledge'}
        onOpenChange={(open) => !open && setActiveDetail(null)}
      />
      <PageIndexDetail
        open={activeDetail === 'pageindex'}
        onOpenChange={(open) => !open && setActiveDetail(null)}
      />
      <RoadmapDetail
        open={activeDetail === 'roadmap'}
        onOpenChange={(open) => !open && setActiveDetail(null)}
      />
      <HandoffsDetail
        open={activeDetail === 'handoffs'}
        onOpenChange={(open) => !open && setActiveDetail(null)}
      />
      </div>
    </ErrorBoundary>
  )
}

export default App
