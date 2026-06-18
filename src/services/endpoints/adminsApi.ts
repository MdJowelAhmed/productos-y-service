import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { admins } from '@/services/mock/seed'
import type { ID } from '@/types/common.types'
import type { Admin, AdminRole } from '@/types/models'

export interface CreateAdminRequest {
  name: string
  email: string
  role: AdminRole
}

export const adminsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<Admin[], void>({
      queryFn: endpoint({ mock: () => admins.map((a) => ({ ...a })), real: () => '/admins' }),
      providesTags: ['Admin'],
    }),

    createAdmin: builder.mutation<Admin, CreateAdminRequest>({
      queryFn: endpoint({
        mock: (body) => {
          const newAdmin: Admin = {
            id: `adm_${admins.length + 1}`,
            ...body,
            status: 'active',
            lastActiveAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }
          admins.unshift(newAdmin)
          return newAdmin
        },
        real: (body) => ({ url: '/admins', method: 'POST', body }),
      }),
      invalidatesTags: ['Admin'],
    }),

    updateAdminStatus: builder.mutation<Admin, { id: ID; status: Admin['status'] }>({
      queryFn: endpoint({
        mock: ({ id, status }) => {
          const admin = admins.find((a) => a.id === id)
          if (!admin) throw new Error('Admin not found')
          admin.status = status
          return admin
        },
        real: ({ id, status }) => ({ url: `/admins/${id}/status`, method: 'PATCH', body: { status } }),
      }),
      invalidatesTags: ['Admin'],
    }),
  }),
})

export const {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminStatusMutation,
} = adminsApi
