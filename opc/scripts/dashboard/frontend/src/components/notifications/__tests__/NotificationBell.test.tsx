import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationBell } from '../NotificationBell'
import { useNotificationStore } from '@/stores/notificationStore'

// Mock ResizeObserver for ScrollArea component
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(),
}))

const mockNotifications = [
  {
    id: 'notif-001',
    type: 'info' as const,
    title: 'System Update',
    message: 'New version available',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: 'notif-002',
    type: 'warning' as const,
    title: 'Memory Warning',
    message: 'Memory usage is high',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: false,
  },
  {
    id: 'notif-003',
    type: 'error' as const,
    title: 'Connection Failed',
    message: 'WebSocket disconnected',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'notif-004',
    type: 'success' as const,
    title: 'Task Complete',
    message: 'Deployment finished',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
]

const mockMarkRead = vi.fn()
const mockMarkAllRead = vi.fn()

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNotificationStore).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      addNotification: vi.fn(),
      clearAll: vi.fn(),
      removeNotification: vi.fn(),
    })
  })

  describe('Bell Icon and Badge', () => {
    it('renders bell icon button', () => {
      render(<NotificationBell />)

      const button = screen.getByRole('button', { name: /notifications/i })
      expect(button).toBeInTheDocument()
    })

    it('shows unread count badge when there are unread notifications', () => {
      render(<NotificationBell />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('hides badge when there are no unread notifications', () => {
      vi.mocked(useNotificationStore).mockReturnValue({
        notifications: mockNotifications,
        unreadCount: 0,
        markRead: mockMarkRead,
        markAllRead: mockMarkAllRead,
        addNotification: vi.fn(),
        clearAll: vi.fn(),
        removeNotification: vi.fn(),
      })

      render(<NotificationBell />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<NotificationBell className="custom-class" />)

      const container = screen.getByRole('button', { name: /notifications/i }).parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Dropdown Menu', () => {
    it('opens dropdown when bell is clicked', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      const button = screen.getByRole('button', { name: /notifications/i })
      await user.click(button)

      // Wait for dropdown content - check for the header text (not the sr-only)
      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument()
      })
    })

    it('shows "Mark all read" button in header', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument()
      })
    })

    it('calls markAllRead when "Mark all read" is clicked', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Mark all read'))

      expect(mockMarkAllRead).toHaveBeenCalled()
    })
  })

  describe('Notification List', () => {
    it('displays all notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('System Update')).toBeInTheDocument()
      })
      expect(screen.getByText('Memory Warning')).toBeInTheDocument()
      expect(screen.getByText('Connection Failed')).toBeInTheDocument()
      expect(screen.getByText('Task Complete')).toBeInTheDocument()
    })

    it('displays notification messages', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('New version available')).toBeInTheDocument()
      })
      expect(screen.getByText('Memory usage is high')).toBeInTheDocument()
    })

    it('calls markRead when notification is clicked', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('System Update')).toBeInTheDocument()
      })

      const notification = screen.getByText('System Update').closest('[role="menuitem"]')!
      await user.click(notification)

      expect(mockMarkRead).toHaveBeenCalledWith('notif-001')
    })

    it('shows relative timestamps', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument()
      })
      expect(screen.getByText(/1 hour ago/i)).toBeInTheDocument()
    })
  })

  describe('Notification Types', () => {
    it('shows info icon for info notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('System Update')).toBeInTheDocument()
      })
      const infoItem = screen.getByText('System Update').closest('[role="menuitem"]')
      expect(infoItem).toHaveClass('text-blue-500')
    })

    it('shows warning icon for warning notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('Memory Warning')).toBeInTheDocument()
      })
      const warningItem = screen.getByText('Memory Warning').closest('[role="menuitem"]')
      expect(warningItem).toHaveClass('text-yellow-500')
    })

    it('shows error icon for error notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument()
      })
      const errorItem = screen.getByText('Connection Failed').closest('[role="menuitem"]')
      expect(errorItem).toHaveClass('text-red-500')
    })

    it('shows success icon for success notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('Task Complete')).toBeInTheDocument()
      })
      const successItem = screen.getByText('Task Complete').closest('[role="menuitem"]')
      expect(successItem).toHaveClass('text-green-500')
    })
  })

  describe('Empty State', () => {
    it('shows empty message when no notifications', async () => {
      vi.mocked(useNotificationStore).mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markRead: mockMarkRead,
        markAllRead: mockMarkAllRead,
        addNotification: vi.fn(),
        clearAll: vi.fn(),
        removeNotification: vi.fn(),
      })

      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('No notifications')).toBeInTheDocument()
      })
    })
  })

  describe('Unread Styling', () => {
    it('applies unread styling to unread notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('System Update')).toBeInTheDocument()
      })
      const unreadItem = screen.getByText('System Update').closest('[role="menuitem"]')
      expect(unreadItem).toHaveClass('bg-accent/50')
    })

    it('does not apply unread styling to read notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument()
      })
      const readItem = screen.getByText('Connection Failed').closest('[role="menuitem"]')
      expect(readItem).not.toHaveClass('bg-accent/50')
    })
  })
})
