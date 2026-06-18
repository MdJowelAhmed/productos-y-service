import type { ListParams, Paginated } from '@/types/api.types'
import { PAGE_SIZE } from '@/lib/constants'

/**
 * Tiny in-memory query helpers used by the mock endpoints.
 * They mirror what a real backend list endpoint would do:
 * search → filter → paginate.
 */

interface CollectionOptions<T> {
  /** Fields to match against the free-text `search` param. */
  searchable?: (keyof T)[]
  /** Field that the `status`/type filters map onto. */
  filters?: Partial<Record<string, (item: T, value: string) => boolean>>
}

export function paginate<T>(
  source: T[],
  params: ListParams = {},
  options: CollectionOptions<T> = {},
): Paginated<T> {
  const { page = 1, pageSize = PAGE_SIZE, search = '', status } = params
  let items = [...source]

  if (search && options.searchable?.length) {
    const q = search.toLowerCase()
    items = items.filter((item) =>
      options.searchable!.some((key) => String(item[key] ?? '').toLowerCase().includes(q)),
    )
  }

  if (status && status !== 'all' && options.filters?.status) {
    items = items.filter((item) => options.filters!.status!(item, status))
  }

  const total = items.length
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
}

export function findById<T extends { id: string }>(source: T[], id: string): T {
  const found = source.find((item) => item.id === id)
  if (!found) throw new Error(`Record not found: ${id}`)
  return found
}
