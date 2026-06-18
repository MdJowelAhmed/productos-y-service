import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-sm">
      <p className="text-ink-500">
        Showing <span className="font-medium text-ink-700">{from}</span>–
        <span className="font-medium text-ink-700">{to}</span> of{' '}
        <span className="font-medium text-ink-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-ink-200 px-2.5 text-ink-700 hover:bg-ink-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <span className="px-3 text-ink-500">
          Page <span className="font-medium text-ink-700">{page}</span> of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-lg border border-ink-200 px-2.5 text-ink-700 hover:bg-ink-50 disabled:opacity-40',
          )}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
