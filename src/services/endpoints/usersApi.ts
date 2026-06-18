import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { findById, paginate } from '@/services/mock/db'
import { products, services, stores, users } from '@/services/mock/seed'
import type { ListParams, Paginated } from '@/types/api.types'
import type { EntityStatus, ID } from '@/types/common.types'
import type { User } from '@/types/models'

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<Paginated<User>, ListParams>({
      queryFn: endpoint({
        mock: (params) =>
          paginate(users, params, {
            searchable: ['name', 'email'],
            filters: { status: (u, v) => u.status === v },
          }),
        real: (params) => ({ url: '/users', params }),
      }),
      providesTags: ['User'],
    }),

    getUser: builder.query<User, ID>({
      queryFn: endpoint({
        mock: (id) => findById(users, id),
        real: (id) => `/users/${id}`,
      }),
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),

    updateUserStatus: builder.mutation<User, { id: ID; status: EntityStatus; reason?: string }>({
      queryFn: endpoint({
        mock: ({ id, status, reason }) => {
          const user = findById(users, id)
          user.status = status
          user.banReason = status === 'suspended' ? reason : undefined
          // Banning an owner takes their store(s) and listings offline too.
          if (status === 'suspended') {
            stores
              .filter((s) => s.ownerId === id)
              .forEach((store) => {
                store.status = 'suspended'
                products.filter((p) => p.storeId === store.id).forEach((p) => (p.status = 'suspended'))
                services.filter((sv) => sv.storeId === store.id).forEach((sv) => (sv.status = 'suspended'))
              })
          }
          return user
        },
        real: ({ id, status, reason }) => ({
          url: `/users/${id}/status`,
          method: 'PATCH',
          body: { status, reason },
        }),
      }),
      invalidatesTags: ['User', 'Store', 'Product', 'Service'],
    }),
  }),
})

export const { useGetUsersQuery, useGetUserQuery, useUpdateUserStatusMutation } = usersApi
