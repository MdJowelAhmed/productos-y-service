import { format, formatDistanceToNow, parseISO } from 'date-fns'

/** Format an ISO date string as "MMM d, yyyy". */
export function formatDate(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy')
}

/** Format an ISO date string as "MMM d, yyyy · h:mm a". */
export function formatDateTime(iso: string) {
  return format(parseISO(iso), "MMM d, yyyy · h:mm a")
}

/** Relative time, e.g. "3 hours ago". */
export function formatRelative(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}
