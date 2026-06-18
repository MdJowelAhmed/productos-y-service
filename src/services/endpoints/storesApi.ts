import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { findById, paginate } from '@/services/mock/db'
import { products, services, stores } from '@/services/mock/seed'
import type { ListParams, Paginated } from '@/types/api.types'
import type { EntityStatus, ID } from '@/types/common.types'
import type { Store, StoreType } from '@/types/models'

interface StoreListParams extends ListParams {
  type?: StoreType | 'all'
}

export const storesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query<Paginated<Store>, StoreListParams>({
      queryFn: endpoint({
        mock: (params) => {
          const typed =
            params.type && params.type !== 'all'
              ? stores.filter((s) => s.type === params.type)
              : stores
          return paginate(typed, params, {
            searchable: ['name', 'ownerName', 'category'],
            filters: { status: (s, v) => s.status === v },
          })
        },
        real: (params) => ({ url: '/stores', params }),
      }),
      providesTags: ['Store'],
    }),

    getStore: builder.query<Store, ID>({
      queryFn: endpoint({ mock: (id) => findById(stores, id), real: (id) => `/stores/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Store', id }],
    }),

    updateStoreStatus: builder.mutation<Store, { id: ID; status: EntityStatus }>({
      queryFn: endpoint({
        mock: ({ id, status }) => {
          const store = findById(stores, id)
          store.status = status
          // Cascade to the store's listings so they never contradict the store
          // (approving a store publishes its pending listings; suspending hides them).
          products.filter((p) => p.storeId === id).forEach((p) => (p.status = status))
          services.filter((s) => s.storeId === id).forEach((s) => (s.status = status))
          return store
        },
        real: ({ id, status }) => ({ url: `/stores/${id}/status`, method: 'PATCH', body: { status } }),
      }),
      invalidatesTags: ['Store', 'Product', 'Service'],
    }),
  }),
})

export const { useGetStoresQuery, useGetStoreQuery, useUpdateStoreStatusMutation } = storesApi
