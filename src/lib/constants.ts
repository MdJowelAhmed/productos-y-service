/** Global non-route constants. */

export const APP = {
  name: 'Productos y Servicios',
  tagline: 'Marketplace Control Center',
} as const

/** Default pagination page size used across data tables. */
export const PAGE_SIZE = 10

/** localStorage keys (single source of truth). */
export const STORAGE_KEYS = {
  token: 'julio.auth.token',
  user: 'julio.auth.user',
} as const
