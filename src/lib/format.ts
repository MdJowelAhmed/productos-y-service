import { format, formatDistanceToNow, parseISO } from 'date-fns'

/** Format an ISO date string as "MMM d, yyyy". */
export function formatDate(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy')
}

/** Format an ISO date string as "MMM d, yyyy · h:mm a". */
export function formatDateTime(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy · h:mm a')
}

/** Relative time, e.g. "3 hours ago". */
export function formatRelative(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

/**
 * Format message time:
 * - If sent today: shows time only ("3:38 PM")
 * - If sent before today: shows date and time ("Aug 19, 3:38 PM")
 */
export function formatMessageTime(iso?: string) {
  if (!iso) return ''
  try {
    const date = parseISO(iso)
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    return isToday ? format(date, 'h:mm a') : format(date, 'MMM d, h:mm a')
  } catch {
    return ''
  }
}
