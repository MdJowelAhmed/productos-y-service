import type { ReactNode } from 'react'

/** Standard filter/search bar that sits above a data table. */
export function TableToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink-100 p-5 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  )
}
