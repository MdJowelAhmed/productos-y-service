import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Report, ReportStatus } from '@/types/models'

export const moderationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<Paginated<Report>, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        return {
          url: '/reports',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Report> => {
        const items = Array.isArray(response?.data) ? response.data : []
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['Report'],
    }),

    resolveReport: builder.mutation<
      Report,
      { id: ID; status: Extract<ReportStatus, 'resolved' | 'dismissed'> }
    >({
      query: ({ id, status }) => ({
        url: `/reports/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ['Report'],
    }),
  }),
})

export const { useGetReportsQuery, useResolveReportMutation } = moderationApi
