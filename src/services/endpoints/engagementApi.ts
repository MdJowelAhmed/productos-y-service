import { api } from '@/services/api'
import type { Announcement, AnnouncementAudience } from '@/types/models'

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
  }),
})

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
} = engagementApi
