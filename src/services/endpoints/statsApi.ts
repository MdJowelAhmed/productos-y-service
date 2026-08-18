import { api } from '@/services/api'
import type { DashboardOverviewData, DashboardOverviewResponse } from '@/types/models'

export const statsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<DashboardOverviewData, void>({
      query: () => ({
        url: '/dashboard/overview',
        method: 'GET',
      }),
      transformResponse: (response: DashboardOverviewResponse) => {
        return response.data
      },
      providesTags: ['Stats'],
    }),
  }),
})

export const { useGetDashboardOverviewQuery } = statsApi
