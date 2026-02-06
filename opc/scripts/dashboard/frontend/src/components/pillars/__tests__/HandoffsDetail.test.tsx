import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HandoffsDetail } from '../HandoffsDetail'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  fetchHandoffs: vi.fn(),
  fetchHandoff: vi.fn(),
}))

const mockHandoffs = {
  handoffs: [
    {
      id: 'handoff-001',
      title: 'Session Transfer - Feature Implementation',
      source: 'db' as const,
      status: 'success',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'handoff-002',
      title: 'Debug Session Handoff',
      source: 'file' as const,
      status: 'partial',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'handoff-003',
      title: 'Blocked Migration',
      source: 'db' as const,
      status: 'blocked',
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
  total: 3,
  page: 1,
  page_size: 20,
}

const mockHandoffDetail = {
  id: 'handoff-001',
  title: 'Session Transfer - Feature Implementation',
  source: 'db' as const,
  status: 'success',
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  content: '## Summary\n\nImplemented the feature successfully.\n\n## Next Steps\n\n- Review code\n- Deploy to staging',
  metadata: { agent: 'kraken' },
}

describe('HandoffsDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.fetchHandoffs).mockResolvedValue(mockHandoffs)
    vi.mocked(api.fetchHandoff).mockResolvedValue(mockHandoffDetail)
  })

  it('renders sheet when open', async () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Handoffs')).toBeInTheDocument()
    })
  })

  it('does not render when closed', () => {
    render(<HandoffsDetail open={false} onOpenChange={() => {}} />)

    expect(screen.queryByText('Handoffs')).not.toBeInTheDocument()
  })

  it('loads and displays handoffs', async () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Session Transfer - Feature Implementation')).toBeInTheDocument()
      expect(screen.getByText('Debug Session Handoff')).toBeInTheDocument()
      expect(screen.getByText('Blocked Migration')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    expect(screen.getByText('Loading handoffs...')).toBeInTheDocument()
  })

  it('displays outcome badges with correct colors', async () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      const successBadge = screen.getByText('success')
      const partialBadge = screen.getByText('partial')
      const blockedBadge = screen.getByText('blocked')

      expect(successBadge).toHaveClass('bg-green-500/15')
      expect(partialBadge).toHaveClass('bg-yellow-500/15')
      expect(blockedBadge).toHaveClass('bg-red-500/15')
    })
  })

  it('displays source indicators', async () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getAllByText('DB').length).toBeGreaterThan(0)
      expect(screen.getByText('File')).toBeInTheDocument()
    })
  })

  it('shows relative timestamps', async () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText(/2 days ago/i)).toBeInTheDocument()
      expect(screen.getByText(/5 hours ago/i)).toBeInTheDocument()
      expect(screen.getByText(/10 minutes ago/i)).toBeInTheDocument()
    })
  })

  it('filters by outcome', async () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Session Transfer - Feature Implementation')).toBeInTheDocument()
    })

    const successFilter = screen.getByRole('button', { name: /success/i })
    fireEvent.click(successFilter)

    await waitFor(() => {
      expect(screen.getByText('Session Transfer - Feature Implementation')).toBeInTheDocument()
      expect(screen.queryByText('Debug Session Handoff')).not.toBeInTheDocument()
      expect(screen.queryByText('Blocked Migration')).not.toBeInTheDocument()
    })
  })

  it('expands handoff to show full content', async () => {
    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Session Transfer - Feature Implementation')).toBeInTheDocument()
    })

    const expandButton = screen.getAllByRole('button', { name: /expand/i })[0]
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText(/Implemented the feature successfully/)).toBeInTheDocument()
    })
  })

  it('shows empty state when no handoffs', async () => {
    vi.mocked(api.fetchHandoffs).mockResolvedValue({
      handoffs: [],
      total: 0,
      page: 1,
      page_size: 20,
    })

    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('No handoffs found')).toBeInTheDocument()
    })
  })

  it('calls onOpenChange when closing', async () => {
    const onOpenChange = vi.fn()
    render(<HandoffsDetail open={true} onOpenChange={onOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText('Handoffs')).toBeInTheDocument()
    })

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error state on fetch failure', async () => {
    vi.mocked(api.fetchHandoffs).mockRejectedValue(new Error('Network error'))

    render(<HandoffsDetail open={true} onOpenChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load handoffs/i)).toBeInTheDocument()
    })
  })
})
