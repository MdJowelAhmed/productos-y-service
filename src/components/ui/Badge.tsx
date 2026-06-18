import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'purple'

const tones: Record<BadgeTone, string> = {
  green: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  gray: 'bg-ink-100 text-ink-700 ring-ink-300/40',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
}

export function Badge({
  children,
  tone = 'gray',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
