import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { paginate } from '@/services/mock/db'
import { plans, subscriptions, transactions } from '@/services/mock/seed'
import { genId } from '@/lib/utils'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Plan, Subscription, Transaction } from '@/types/models'

export type PlanInput = Omit<Plan, 'id'>

export function mapBackendSubscriptionToSubscription(raw: any): Subscription {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')

  const pkg = typeof raw.packageId === 'object' ? raw.packageId : null
  const usr = typeof raw.userId === 'object' ? raw.userId : null
  const str = typeof raw.store === 'object' ? raw.store : null

  const storeId = str?._id || raw.storeId || ''
  const storeName = str?.displayName || str?.name || raw.storeName || 'N/A'

  const rawStoreType = str?.storeType || raw.storeType || 'product'
  const storeType =
    rawStoreType === 'product_store' || rawStoreType === 'product' ? 'product' : 'service'

  const planId = pkg?._id || (typeof raw.packageId === 'string' ? raw.packageId : raw.planId) || ''
  const planName = pkg?.name || raw.planName || 'N/A'

  const amount = typeof raw.amountPaid === 'number' ? raw.amountPaid : (pkg?.price ?? raw.amount ?? 0)

  const rawDuration = pkg?.duration || raw.interval || 'monthly'
  const interval = rawDuration === 'seven_days' ? '7 days' : rawDuration

  const ownerName = usr?.name || raw.ownerName || 'N/A'
  const expiresAt = raw.expiresAt || raw.currentPeriodEnd || raw.createdAt || new Date().toISOString()
  const createdAt = raw.createdAt || new Date().toISOString()

  return {
    id,
    _id: raw._id || id,
    storeId,
    storeName,
    ownerName,
    storeType,
    planId,
    planName,
    amount,
    amountPaid: raw.amountPaid,
    currency: raw.currency || 'USD',
    interval,
    status: raw.status || 'active',
    currentPeriodStart: raw.createdAt || raw.currentPeriodStart || createdAt,
    currentPeriodEnd: expiresAt,
    expiresAt: raw.expiresAt,
    createdAt,
    updatedAt: raw.updatedAt,
    stripeSubscriptionId: raw.stripeSubscriptionId,
    stripeSessionId: raw.stripeSessionId,
    trxId: raw.trxId,
    packageType: raw.packageType,
    isDeleted: raw.isDeleted,
    packageId: pkg || undefined,
    userId: usr || undefined,
    store: str || undefined,
  }
}

/** Subscriptions + plans (billing domain). */
export const billingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query<Paginated<Subscription>, ListParams & { plan?: string }>({
      queryFn: endpoint({
        mock: ({ plan, ...params }) => {
          const scoped =
            plan && plan !== 'all' ? subscriptions.filter((s) => s.planName === plan) : subscriptions
          return paginate(scoped, params, {
            searchable: ['storeName', 'ownerName', 'planName'],
            filters: { status: (s, v) => s.status === v },
          })
        },
        real: (params) => {
          const queryParams: Record<string, any> = {}
          if (params?.page) queryParams.page = params.page
          if (params?.pageSize) queryParams.limit = params.pageSize
          if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
          if (params?.status && params.status !== 'all') queryParams.status = params.status
          if (params?.plan && params.plan !== 'all') queryParams.packageId = params.plan
          return {
            url: '/subscriptions',
            method: 'GET',
            params: queryParams,
          }
        },
        transformReal: (response: any): Paginated<Subscription> => {
          let rawData = response?.data
          if (rawData && !Array.isArray(rawData) && Array.isArray(rawData.data)) {
            rawData = rawData.data
          }
          const dataList = Array.isArray(rawData)
            ? rawData
            : Array.isArray(response)
            ? response
            : []
          const meta = response?.meta || response?.data?.meta || {}
          return {
            items: dataList.map(mapBackendSubscriptionToSubscription),
            total: meta.total ?? dataList.length,
            page: meta.page ?? 1,
            pageSize: meta.limit ?? meta.pageSize ?? 10,
          }
        },
      }),
      providesTags: ['Subscription'],
    }),

    getPlans: builder.query<Plan[], void>({
      queryFn: endpoint({ mock: () => plans.map((p) => ({ ...p })), real: () => '/plans' }),
      providesTags: ['Plan'],
    }),

    togglePlan: builder.mutation<Plan, { id: ID; isActive: boolean }>({
      queryFn: endpoint({
        mock: ({ id, isActive }) => {
          const plan = plans.find((p) => p.id === id)
          if (!plan) throw new Error('Plan not found')
          plan.isActive = isActive
          return plan
        },
        real: ({ id, isActive }) => ({ url: `/plans/${id}`, method: 'PATCH', body: { isActive } }),
      }),
      async onQueryStarted({ id, isActive }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          billingApi.util.updateQueryData('getPlans', undefined, (draft) => {
            const plan = draft.find((p) => p.id === id)
            if (plan) plan.isActive = isActive
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    createPlan: builder.mutation<Plan, PlanInput>({
      queryFn: endpoint({
        mock: (body) => {
          const created: Plan = { id: genId('pln'), ...body }
          plans.push(created)
          return created
        },
        real: (body) => ({ url: '/plans', method: 'POST', body }),
      }),
      invalidatesTags: ['Plan'],
    }),

    updatePlan: builder.mutation<Plan, { id: ID } & PlanInput>({
      queryFn: endpoint({
        mock: ({ id, ...changes }) => {
          const plan = plans.find((p) => p.id === id)
          if (!plan) throw new Error('Plan not found')
          Object.assign(plan, changes)
          return plan
        },
        real: ({ id, ...body }) => ({ url: `/plans/${id}`, method: 'PUT', body }),
      }),
      invalidatesTags: ['Plan'],
    }),

    deletePlan: builder.mutation<{ id: ID }, ID>({
      queryFn: endpoint({
        mock: (id) => {
          const idx = plans.findIndex((p) => p.id === id)
          if (idx === -1) throw new Error('Plan not found')
          plans.splice(idx, 1)
          return { id }
        },
        real: (id) => ({ url: `/plans/${id}`, method: 'DELETE' }),
      }),
      invalidatesTags: ['Plan'],
    }),

    cancelSubscription: builder.mutation<Subscription, ID>({
      queryFn: endpoint({
        mock: (id) => {
          const sub = subscriptions.find((s) => s.id === id)
          if (!sub) throw new Error('Subscription not found')
          sub.status = 'canceled'
          return sub
        },
        real: (id) => ({ url: `/subscriptions/${id}/cancel`, method: 'POST' }),
      }),
      invalidatesTags: ['Subscription'],
    }),

    /* Transactions / payment history */
    getTransactions: builder.query<Paginated<Transaction>, ListParams>({
      queryFn: endpoint({
        mock: (params) =>
          paginate(transactions, params, {
            searchable: ['storeName', 'planName', 'invoiceNo'],
            filters: { status: (t, v) => t.status === v },
          }),
        real: (params) => ({ url: '/transactions', params }),
      }),
      providesTags: ['Transaction'],
    }),

    refundTransaction: builder.mutation<Transaction, ID>({
      queryFn: endpoint({
        mock: (id) => {
          const txn = transactions.find((t) => t.id === id)
          if (!txn) throw new Error('Transaction not found')
          txn.status = 'refunded'
          return txn
        },
        real: (id) => ({ url: `/transactions/${id}/refund`, method: 'POST' }),
      }),
      invalidatesTags: ['Transaction'],
    }),
  }),
})

export const {
  useGetSubscriptionsQuery,
  useGetPlansQuery,
  useTogglePlanMutation,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useCancelSubscriptionMutation,
  useGetTransactionsQuery,
  useRefundTransactionMutation,
} = billingApi
