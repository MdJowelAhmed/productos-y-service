import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { EntityStatus, ID } from '@/types/common.types'
import type { Product, Service, Store, StoreDetailData, StoreType } from '@/types/models'

interface StoreListParams extends ListParams {
  type?: StoreType | 'all'
}

export function mapBackendStoreToStore(raw: any): Store {
  if (!raw) return raw
  const imageUrlBase = (import.meta.env.VITE_IMAGE_URL as string | undefined) || ''

  const logoUrl = raw.logo
    ? raw.logo.startsWith('http')
      ? raw.logo
      : `${imageUrlBase}${raw.logo}`
    : undefined

  const coverImageUrl = raw.coverImage
    ? raw.coverImage.startsWith('http')
      ? raw.coverImage
      : `${imageUrlBase}${raw.coverImage}`
    : undefined

  const documentFrontUrl = raw.documentFront
    ? raw.documentFront.startsWith('http')
      ? raw.documentFront
      : `${imageUrlBase}${raw.documentFront}`
    : undefined

  const documentBackUrl = raw.documentBack
    ? raw.documentBack.startsWith('http')
      ? raw.documentBack
      : `${imageUrlBase}${raw.documentBack}`
    : undefined

  const tradeLicenseUrl = raw.tradeLicense
    ? raw.tradeLicense.startsWith('http')
      ? raw.tradeLicense
      : `${imageUrlBase}${raw.tradeLicense}`
    : undefined

  const ownerObj = typeof raw.owner === 'object' ? raw.owner : null
  const ownerName = ownerObj?.name || raw.ownerName || 'Unknown Owner'
  const ownerId = ownerObj?._id || (typeof raw.owner === 'string' ? raw.owner : raw.ownerId)

  const categoryObj = typeof raw.categoryId === 'object' ? raw.categoryId : null
  const categoryName = categoryObj?.name || raw.category || 'General'

  let storeType: StoreType = 'product'
  if (raw.storeType === 'service_store' || raw.storeType === 'service' || raw.type === 'service') {
    storeType = 'service'
  }

  return {
    id: String(raw._id || raw.id || ''),
    name: raw.displayName || raw.name || '',
    type: storeType,
    ownerId: String(ownerId || ''),
    ownerName,
    logoUrl,
    coverImageUrl,
    category: categoryName,
    status: raw.status || 'active',
    planName: raw.plan || raw.planName,
    listingCount: raw.listings ?? raw.listingCount ?? 0,
    rating: raw.averageRating ?? raw.rating ?? 0,
    createdAt: raw.createdAt || new Date().toISOString(),

    description: raw.description,
    phone: raw.phone,
    whatsapp: raw.whatsapp,
    email: raw.email,
    streetAddress: raw.streetAddress,
    city: raw.city,
    postalCode: raw.postalCode,
    businessLicenseNumber: raw.businessLicenseNumber,
    tinNumber: raw.tinNumber,
    tradeLicenseUrl,
    documentFrontUrl,
    documentBackUrl,
    documentType: raw.documentType,
    isVerified: Boolean(raw.isVerified),
    ratingCount: raw.ratingCount ?? 0,
    visitorCount: raw.visitorCount ?? 0,
    owner: ownerObj,
  }
}

export function mapBackendProductToProduct(raw: any): Product {
  const imageUrlBase = (import.meta.env.VITE_IMAGE_URL as string | undefined) || ''
  const firstImage = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : raw.imageUrl
  const imageUrl = firstImage
    ? firstImage.startsWith('http')
      ? firstImage
      : `${imageUrlBase}${firstImage}`
    : undefined

  return {
    id: String(raw._id || raw.id || ''),
    title: raw.title || '',
    storeId: String(raw.storeId || ''),
    storeName: raw.storeName || '',
    category: typeof raw.categoryId === 'object' ? raw.categoryId?.name : raw.category || 'General',
    price: raw.activePrice ?? raw.price ?? 0,
    currency: raw.currency || 'USD',
    stock: raw.stock ?? 1,
    status: raw.status || 'active',
    imageUrl,
    createdAt: raw.createdAt || new Date().toISOString(),
  }
}

export function mapBackendServiceToService(raw: any): Service {
  const imageUrlBase = (import.meta.env.VITE_IMAGE_URL as string | undefined) || ''
  const firstImage = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : raw.imageUrl
  const imageUrl = firstImage
    ? firstImage.startsWith('http')
      ? firstImage
      : `${imageUrlBase}${firstImage}`
    : undefined

  return {
    id: String(raw._id || raw.id || ''),
    title: raw.title || '',
    storeId: String(raw.storeId || ''),
    storeName: raw.storeName || '',
    category: typeof raw.categoryId === 'object' ? raw.categoryId?.name : raw.category || 'General',
    price: raw.activePrice ?? raw.price ?? 0,
    currency: raw.currency || 'USD',
    pricingUnit: raw.pricingUnit || 'project',
    status: raw.status || 'active',
    imageUrl,
    createdAt: raw.createdAt || new Date().toISOString(),
  }
}

export const storesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query<Paginated<Store>, StoreListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        if (params?.type && params.type !== 'all') {
          queryParams.storeType =
            params.type === 'product'
              ? 'product_store'
              : params.type === 'service'
              ? 'service_store'
              : params.type
        }

        return {
          url: '/stores',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Store> => {
        let rawData = response?.data
        if (rawData && !Array.isArray(rawData) && Array.isArray(rawData.data)) {
          rawData = rawData.data
        }
        const dataList = Array.isArray(rawData) ? rawData : Array.isArray(response) ? response : []
        const meta = response?.meta || response?.data?.meta || {}

        return {
          items: dataList.map(mapBackendStoreToStore),
          total: meta.total ?? dataList.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? meta.pageSize ?? 10,
        }
      },
      providesTags: ['Store'],
    }),

    getStore: builder.query<StoreDetailData, ID>({
      query: (id) => ({
        url: `/stores/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any): StoreDetailData => {
        const data = response?.data || response
        const storeRaw = data?.store || data
        const rawProducts = Array.isArray(data?.products) ? data.products : []
        const rawServices = Array.isArray(data?.services) ? data.services : []

        return {
          store: mapBackendStoreToStore(storeRaw),
          products: rawProducts.map(mapBackendProductToProduct),
          services: rawServices.map(mapBackendServiceToService),
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Store', id }],
    }),

    updateStoreStatus: builder.mutation<Store, { id: ID; status: EntityStatus | string }>({
      query: ({ id, status }) => ({
        url: `/stores/status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: any): Store => {
        const storeRaw = response?.data || response
        return mapBackendStoreToStore(storeRaw)
      },
      invalidatesTags: ['Store', 'Product', 'Service'],
    }),

    verifyStore: builder.mutation<Store, { id: ID; isVerified: boolean }>({
      query: ({ id, isVerified }) => ({
        url: `/stores/verify/${id}`,
        method: 'PATCH',
        body: { isVerified },
      }),
      transformResponse: (response: any): Store => {
        const storeRaw = response?.data || response
        return mapBackendStoreToStore(storeRaw)
      },
      invalidatesTags: ['Store'],
    }),
  }),
})

export const {
  useGetStoresQuery,
  useGetStoreQuery,
  useUpdateStoreStatusMutation,
  useVerifyStoreMutation,
} = storesApi
