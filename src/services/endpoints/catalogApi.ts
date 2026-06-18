import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { paginate } from '@/services/mock/db'
import { products, services } from '@/services/mock/seed'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Product, Service } from '@/types/models'

/** Products and services share list semantics, so they live together. */
export const catalogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Paginated<Product>, ListParams>({
      queryFn: endpoint({
        mock: (params) =>
          paginate(products, params, {
            searchable: ['title', 'storeName', 'category'],
            filters: { status: (p, v) => p.status === v },
          }),
        real: (params) => ({ url: '/products', params }),
      }),
      providesTags: ['Product'],
    }),

    getServices: builder.query<Paginated<Service>, ListParams>({
      queryFn: endpoint({
        mock: (params) =>
          paginate(services, params, {
            searchable: ['title', 'storeName', 'category'],
            filters: { status: (s, v) => s.status === v },
          }),
        real: (params) => ({ url: '/services', params }),
      }),
      providesTags: ['Service'],
    }),

    /* Listings scoped to a single store (used in the store detail page). */
    getStoreProducts: builder.query<Product[], ID>({
      queryFn: endpoint({
        mock: (storeId) => products.filter((p) => p.storeId === storeId),
        real: (storeId) => `/stores/${storeId}/products`,
      }),
      providesTags: ['Product'],
    }),

    getStoreServices: builder.query<Service[], ID>({
      queryFn: endpoint({
        mock: (storeId) => services.filter((s) => s.storeId === storeId),
        real: (storeId) => `/stores/${storeId}/services`,
      }),
      providesTags: ['Service'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetServicesQuery,
  useGetStoreProductsQuery,
  useGetStoreServicesQuery,
} = catalogApi
