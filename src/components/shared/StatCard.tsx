import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  /** Percentage change vs previous period. */
  delta?: number
  loading?: boolean
}

export function StatCard({ label, value, icon: Icon, delta, loading }: StatCardProps) {
  const positive = (delta ?? 0) >= 0
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        {delta !== undefined && !loading && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-sm font-medium',
              positive ? 'text-brand-600' : 'text-red-600',
            )}
          >
            {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-ink-500">{label}</p>
        {loading ? (
          <div className="mt-1 h-8 w-24 animate-pulse rounded bg-ink-100" />
        ) : (
          <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
        )}
      </div>
    </Card>
  )
}
