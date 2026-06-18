import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import type { DashboardStats, StoreTypeBreakdown, TimeSeriesPoint } from '@/types/models'
import { stores, subscriptions, users } from '@/services/mock/seed'

function buildStats(): DashboardStats {
  // "Active" includes trials for the count, but MRR is real recurring revenue —
  // only paying (active) subscriptions, not trials.
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing')
  const payingSubs = subscriptions.filter((s) => s.status === 'active')
  const mrr = payingSubs.reduce((sum, s) => sum + (s.interval === 'yearly' ? s.amount / 12 : s.amount), 0)
  return {
    totalUsers: users.length,
    totalStores: stores.length,
    activeSubscriptions: activeSubs.length,
    mrr: Math.round(mrr),
    deltas: { users: 12.5, stores: 8.2, subscriptions: 5.1, mrr: 9.7 },
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const series: TimeSeriesPoint[] = MONTHS.map((label, i) => ({
  label,
  revenue: 1800 + i * 420 + (i % 2) * 180,
  signups: 40 + i * 12 + (i % 3) * 8,
}))

const breakdown: StoreTypeBreakdown[] = [
  { type: 'product', count: stores.filter((s) => s.type === 'product').length },
  { type: 'service', count: stores.filter((s) => s.type === 'service').length },
]

export const statsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      queryFn: endpoint({ mock: () => buildStats(), real: () => '/stats/overview' }),
      providesTags: ['Stats'],
    }),
    getRevenueSeries: builder.query<TimeSeriesPoint[], void>({
      queryFn: endpoint({ mock: () => series, real: () => '/stats/revenue' }),
      providesTags: ['Stats'],
    }),
    getStoreTypeBreakdown: builder.query<StoreTypeBreakdown[], void>({
      queryFn: endpoint({ mock: () => breakdown, real: () => '/stats/store-types' }),
      providesTags: ['Stats'],
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useGetRevenueSeriesQuery,
  useGetStoreTypeBreakdownQuery,
} = statsApi
