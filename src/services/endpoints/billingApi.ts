import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { paginate } from '@/services/mock/db'
import { plans, subscriptions, transactions } from '@/services/mock/seed'
import { genId } from '@/lib/utils'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { BillingInterval, Plan, StoreType, Subscription, Transaction } from '@/types/models'

export type PlanInput = {
  name: string
  price: number
  duration?: 'seven_days' | 'one_month' | 'three_month' | 'six_month' | 'one_year' | string
  packageType?: 'store_creation' | 'post_add' | string
  listingLimit?: number | null
  isUnlimitedListings?: boolean
  trialEnabled?: boolean
  trialPeriodDays?: number
  features: string[]
  status?: string
  isActive?: boolean
  currency?: string
  interval?: BillingInterval
  appliesTo?: StoreType[]
  popular?: boolean
}

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

export function mapBackendPackageToPlan(raw: any): Plan {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')

  const duration = raw.duration || 'one_month'
  const intervalMap: Record<string, string> = {
    seven_days: '7 Days',
    one_month: '1 Month',
    three_month: '3 Months',
    six_month: '6 Months',
    one_year: '1 Year',
  }
  const interval = intervalMap[duration] || raw.interval || duration

  const status = raw.status || (raw.isActive === false ? 'inactive' : 'active')
  const isActive = status === 'active'

  return {
    id,
    _id: raw._id || id,
    name: raw.name || '',
    price: typeof raw.price === 'number' ? raw.price : 0,
    currency: raw.currency || 'USD',
    interval,
    duration,
    status,
    packageType: raw.packageType || 'store_creation',
    listingLimit: raw.isUnlimitedListings ? null : (raw.listingLimit ?? 0),
    isUnlimitedListings: Boolean(raw.isUnlimitedListings),
    trialEnabled: Boolean(raw.trialEnabled),
    trialPeriodDays: raw.trialPeriodDays ?? 0,
    stripeProductId: raw.stripeProductId,
    stripePriceId: raw.stripePriceId,
    features: Array.isArray(raw.features) ? raw.features : [],
    isActive,
    appliesTo: raw.appliesTo || ['product', 'service'],
    popular: Boolean(raw.popular),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
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
      queryFn: endpoint({
        mock: () => plans.map((p) => mapBackendPackageToPlan(p)),
        real: () => ({ url: '/subscription-packages', method: 'GET' }),
        transformReal: (response: any): Plan[] => {
          const list = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : []
          return list.map(mapBackendPackageToPlan)
        },
      }),
      providesTags: ['Plan'],
    }),

    togglePlan: builder.mutation<Plan, { id: ID; isActive?: boolean; status?: string }>({
      queryFn: endpoint({
        mock: ({ id, isActive, status }) => {
          const plan = plans.find((p) => p.id === id)
          if (!plan) throw new Error('Plan not found')
          const targetStatus = status || (isActive ? 'active' : 'inactive')
          plan.status = targetStatus
          plan.isActive = targetStatus === 'active'
          return plan
        },
        real: ({ id, isActive, status }) => {
          const targetStatus = status || (isActive ? 'active' : 'inactive')
          return {
            url: `/subscription-packages/${id}/status`,
            method: 'PATCH',
            body: { status: targetStatus },
          }
        },
        transformReal: (response: any) => {
          const item = response?.data || response
          return mapBackendPackageToPlan(item)
        },
      }),
      invalidatesTags: ['Plan'],
    }),

    createPlan: builder.mutation<Plan, PlanInput>({
      queryFn: endpoint({
        mock: (body) => {
          const created: Plan = mapBackendPackageToPlan({
            _id: genId('pln'),
            currency: 'USD',
            appliesTo: ['product', 'service'],
            status: 'active',
            duration: body.duration || 'seven_days',
            ...body,
          })
          plans.push(created)
          return created
        },
        real: (body) => {
          const payload = {
            name: body.name,
            price: body.price,
            duration: body.duration || 'seven_days',
            packageType: body.packageType || 'store_creation',
            listingLimit: body.isUnlimitedListings ? 0 : (body.listingLimit ?? 0),
            isUnlimitedListings: Boolean(body.isUnlimitedListings),
            trialEnabled: Boolean(body.trialEnabled),
            trialPeriodDays: body.trialPeriodDays ?? 0,
            features: body.features || [],
          }
          return {
            url: '/subscription-packages',
            method: 'POST',
            body: payload,
          }
        },
        transformReal: (response: any) => {
          const item = response?.data || response
          return mapBackendPackageToPlan(item)
        },
      }),
      invalidatesTags: ['Plan'],
    }),

    updatePlan: builder.mutation<Plan, { id: ID } & Partial<PlanInput>>({
      queryFn: endpoint({
        mock: ({ id, ...changes }) => {
          const plan = plans.find((p) => p.id === id)
          if (!plan) throw new Error('Plan not found')
          Object.assign(plan, changes)
          return plan
        },
        real: ({ id, ...body }) => {
          const payload: Record<string, any> = {}
          if (body.name !== undefined) payload.name = body.name
          if (body.price !== undefined) payload.price = body.price
          if (body.duration !== undefined) payload.duration = body.duration
          if (body.packageType !== undefined) payload.packageType = body.packageType
          if (body.listingLimit !== undefined) payload.listingLimit = body.isUnlimitedListings ? 0 : body.listingLimit
          if (body.isUnlimitedListings !== undefined) payload.isUnlimitedListings = Boolean(body.isUnlimitedListings)
          if (body.trialEnabled !== undefined) payload.trialEnabled = Boolean(body.trialEnabled)
          if (body.trialPeriodDays !== undefined) payload.trialPeriodDays = body.trialPeriodDays
          if (body.features !== undefined) payload.features = body.features

          return {
            url: `/subscription-packages/${id}`,
            method: 'PATCH',
            body: payload,
          }
        },
        transformReal: (response: any) => {
          const item = response?.data || response
          return mapBackendPackageToPlan(item)
        },
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
        real: (id) => ({
          url: `/subscription-packages/${id}`,
          method: 'DELETE',
        }),
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
