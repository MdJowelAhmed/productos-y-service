import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { paginate } from '@/services/mock/db'
import { reports } from '@/services/mock/seed'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Report, ReportStatus } from '@/types/models'

export const moderationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<Paginated<Report>, ListParams>({
      queryFn: endpoint({
        mock: (params) =>
          paginate(reports, params, {
            searchable: ['targetName', 'reporterName', 'reason'],
            filters: { status: (r, v) => r.status === v },
          }),
        real: (params) => ({ url: '/reports', params }),
      }),
      providesTags: ['Report'],
    }),

    resolveReport: builder.mutation<Report, { id: ID; status: Extract<ReportStatus, 'resolved' | 'dismissed'> }>({
      queryFn: endpoint({
        mock: ({ id, status }) => {
          const report = reports.find((r) => r.id === id)
          if (!report) throw new Error('Report not found')
          report.status = status
          report.resolvedAt = new Date().toISOString()
          return report
        },
        real: ({ id, status }) => ({ url: `/reports/${id}`, method: 'PATCH', body: { status } }),
      }),
      invalidatesTags: ['Report'],
    }),
  }),
})

export const { useGetReportsQuery, useResolveReportMutation } = moderationApi
