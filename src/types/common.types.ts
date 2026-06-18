/** Shared primitive/util types used across features. */

export type ID = string

export type ISODate = string

/** Generic status used by many entities (users, stores, listings). */
export type EntityStatus = 'active' | 'pending' | 'suspended' | 'rejected'

export interface Money {
  amount: number
  currency: string
}

/** Common option shape for selects, filters, tabs. */
export interface Option<T extends string = string> {
  label: string
  value: T
}
