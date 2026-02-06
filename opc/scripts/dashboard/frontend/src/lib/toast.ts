import { toast } from 'sonner'

export function showPillarStatusToast(pillar: string, status: string, previousStatus?: string) {
  const title = `${pillar} Status Changed`
  const description = previousStatus
    ? `${previousStatus} → ${status}`
    : `Now ${status}`

  if (status === 'offline') {
    toast.error(title, { description })
  } else if (status === 'degraded') {
    toast.warning(title, { description })
  } else if (status === 'online' && previousStatus === 'offline') {
    toast.success(title, { description: 'Service recovered' })
  } else {
    toast.info(title, { description })
  }
}
