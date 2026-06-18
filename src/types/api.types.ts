/** Transport-level types shared by all RTK Query endpoints. */

/** Standard envelope for paginated list endpoints. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** Common query params for list endpoints. */
export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sort?: string
}

export interface ApiError {
  status: number
  message: string
}
