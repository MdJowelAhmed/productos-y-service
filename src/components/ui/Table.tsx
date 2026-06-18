import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LoadingState } from './Spinner'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  /** Stable key for the column. */
  key: string
  header: ReactNode
  /** Cell renderer. */
  render: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  /** Allow this cell's content to wrap instead of forcing a single line. */
  wrap?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' }

export function Table<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  onRowClick,
}: TableProps<T>) {
  if (loading) return <LoadingState />
  if (rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} />

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-500',
                  alignClass[col.align ?? 'left'],
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-ink-50 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-ink-50',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-5 py-4 text-ink-700',
                    col.wrap ? 'whitespace-normal' : 'whitespace-nowrap',
                    alignClass[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
