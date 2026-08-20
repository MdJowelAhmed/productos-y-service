import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { Announcement, AnnouncementAudience, AuditLog } from '@/types/models'

export interface CreateAnnouncementRequest {
  title: string
  body: string
  audience: AnnouncementAudience
  channel: Announcement['channel']
}

export const engagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => ({ url: '/announcements', method: 'GET' }),
      transformResponse: (response: any): Announcement[] =>
        Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [],
      providesTags: ['Announcement'],
    }),

    createAnnouncement: builder.mutation<Announcement, CreateAnnouncementRequest>({
      query: (body) => ({
        url: '/announcements',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ['Announcement'],
    }),

    getAuditLogs: builder.query<Paginated<AuditLog>, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        return {
          url: '/audit-logs',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<AuditLog> => {
        const items = Array.isArray(response?.data) ? response.data : []
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['AuditLog'],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useGetAuditLogsQuery,
} = engagementApi
