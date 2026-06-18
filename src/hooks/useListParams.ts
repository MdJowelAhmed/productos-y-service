import { useMemo, useState } from 'react'
import { useDebounce } from './useDebounce'
import type { ListParams } from '@/types/api.types'

/**
 * Shared state for list/table pages: search (debounced), status filter,
 * and pagination. Returns both the raw controls (for inputs) and the
 * assembled `params` object ready to pass into an RTK Query list hook.
 */
export function useListParams(initial?: { status?: string }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initial?.status ?? 'all')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(search)

  const params: ListParams = useMemo(
    () => ({ page, search: debouncedSearch, status }),
    [page, debouncedSearch, status],
  )

  return {
    search,
    setSearch: (v: string) => {
      setSearch(v)
      setPage(1)
    },
    status,
    setStatus: (v: string) => {
      setStatus(v)
      setPage(1)
    },
    page,
    setPage,
    params,
  }
}
