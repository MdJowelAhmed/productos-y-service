import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { paginate } from '@/services/mock/db'
import { announcements, auditLogs } from '@/services/mock/seed'
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
      queryFn: endpoint({ mock: () => announcements, real: () => '/announcements' }),
      providesTags: ['Announcement'],
    }),

    createAnnouncement: builder.mutation<Announcement, CreateAnnouncementRequest>({
      queryFn: endpoint({
        mock: (body) => {
          const created: Announcement = {
            id: `ann_${9000 + announcements.length}`,
            ...body,
            status: 'sent',
            recipients: 1500,
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }
          announcements.unshift(created)
          return created
        },
        real: (body) => ({ url: '/announcements', method: 'POST', body }),
      }),
      invalidatesTags: ['Announcement'],
    }),

    getAuditLogs: builder.query<Paginated<AuditLog>, ListParams>({
      queryFn: endpoint({
        mock: (params) =>
          paginate(auditLogs, params, { searchable: ['actorName', 'action', 'targetName'] }),
        real: (params) => ({ url: '/audit-logs', params }),
      }),
      providesTags: ['AuditLog'],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useGetAuditLogsQuery,
} = engagementApi
