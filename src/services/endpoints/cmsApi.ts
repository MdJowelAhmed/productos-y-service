import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { banners, contentPages, faqs } from '@/services/mock/seed'
import { genId } from '@/lib/utils'
import type { ID } from '@/types/common.types'
import type { Banner, BannerPlacement, ContentPage, ContentStatus, Faq } from '@/types/models'

export interface UpdateContentPageRequest {
  id: ID
  title: string
  content: string
  status: ContentStatus
}

export interface BannerInput {
  name?: string
  title?: string
  description?: string
  imageFile?: File | null
  imageUrl?: string
  placement?: BannerPlacement
  isActive?: boolean
  startsAt?: string
  endsAt?: string
}

export function mapBackendBannerToBanner(raw: any): Banner {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')
  const name = raw.name || raw.title || ''
  const description = raw.description || ''
  const imagePath = raw.image || raw.imageUrl || ''
  const rawStatus = raw.status
  const isActive = typeof rawStatus === 'boolean' ? rawStatus : rawStatus === 'active' || raw.isActive !== false

  return {
    id,
    _id: raw._id || id,
    title: name,
    name,
    description,
    imageUrl: imagePath,
    image: imagePath,
    placement: raw.placement || 'home_top',
    isActive,
    status: typeof rawStatus === 'boolean' ? (rawStatus ? 'active' : 'inactive') : (rawStatus || (isActive ? 'active' : 'inactive')),
    isDeleted: raw.isDeleted,
    startsAt: raw.startsAt || raw.createdAt || new Date().toISOString(),
    endsAt: raw.endsAt || raw.updatedAt || new Date().toISOString(),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export type FaqInput = Omit<Faq, 'id'>

export const cmsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /* Banners */
    getBanners: builder.query<Banner[], void>({
      queryFn: endpoint({
        mock: () => banners.map((b) => mapBackendBannerToBanner(b)),
        real: () => ({ url: '/banners/all', method: 'GET' }),
        transformReal: (response: any): Banner[] => {
          const list = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : []
          return list.map(mapBackendBannerToBanner)
        },
      }),
      providesTags: ['Banner'],
    }),

    toggleBanner: builder.mutation<Banner, { id: ID; isActive: boolean }>({
      queryFn: endpoint({
        mock: ({ id, isActive }) => {
          const banner = banners.find((b) => b.id === id)
          if (!banner) throw new Error('Banner not found')
          banner.isActive = isActive
          banner.status = isActive ? 'active' : 'inactive'
          return banner
        },
        real: ({ id, isActive }) => ({
          url: `/banners/status/${id}`,
          method: 'PATCH',
          body: { status: isActive },
        }),
        transformReal: (response: any) => mapBackendBannerToBanner(response?.data || response),
      }),
      invalidatesTags: ['Banner'],
    }),

    createBanner: builder.mutation<Banner, BannerInput>({
      queryFn: endpoint({
        mock: (body) => {
          const created: Banner = mapBackendBannerToBanner({
            _id: genId('bnr'),
            name: body.name || body.title || 'Untitled Banner',
            description: body.description || '',
            image: body.imageUrl || '/uploads/image/default.png',
            status: 'active',
            ...body,
          })
          banners.unshift(created)
          return created
        },
        real: (body) => {
          const formData = new FormData()
          formData.append(
            'data',
            JSON.stringify({
              name: body.name || body.title || '',
              description: body.description || '',
            }),
          )
          if (body.imageFile) {
            formData.append('image', body.imageFile)
          }
          return {
            url: '/banners',
            method: 'POST',
            body: formData,
          }
        },
        transformReal: (response: any) => mapBackendBannerToBanner(response?.data || response),
      }),
      invalidatesTags: ['Banner'],
    }),

    updateBanner: builder.mutation<Banner, { id: ID } & Partial<BannerInput>>({
      queryFn: endpoint({
        mock: ({ id, ...changes }) => {
          const banner = banners.find((b) => b.id === id)
          if (!banner) throw new Error('Banner not found')
          Object.assign(banner, changes)
          if (changes.name) banner.title = changes.name
          return banner
        },
        real: ({ id, ...body }) => {
          const formData = new FormData()
          formData.append(
            'data',
            JSON.stringify({
              name: body.name || body.title || '',
              description: body.description || '',
            }),
          )
          if (body.imageFile) {
            formData.append('image', body.imageFile)
          }
          return {
            url: `/banners/${id}`,
            method: 'PATCH',
            body: formData,
          }
        },
        transformReal: (response: any) => mapBackendBannerToBanner(response?.data || response),
      }),
      invalidatesTags: ['Banner'],
    }),

    deleteBanner: builder.mutation<{ id: ID }, ID>({
      queryFn: endpoint({
        mock: (id) => {
          const idx = banners.findIndex((b) => b.id === id)
          if (idx === -1) throw new Error('Banner not found')
          banners.splice(idx, 1)
          return { id }
        },
        real: (id) => ({ url: `/banners/${id}`, method: 'DELETE' }),
      }),
      invalidatesTags: ['Banner'],
    }),

    /* Content pages */
    getContentPages: builder.query<ContentPage[], void>({
      queryFn: endpoint({ mock: () => contentPages.map((p) => ({ ...p })), real: () => '/cms/pages' }),
      providesTags: ['ContentPage'],
    }),
    updateContentPage: builder.mutation<ContentPage, UpdateContentPageRequest>({
      queryFn: endpoint({
        mock: ({ id, ...changes }) => {
          const page = contentPages.find((p) => p.id === id)
          if (!page) throw new Error('Page not found')
          Object.assign(page, changes, { updatedAt: new Date().toISOString() })
          return { ...page }
        },
        real: ({ id, ...body }) => ({ url: `/cms/pages/${id}`, method: 'PATCH', body }),
      }),
      invalidatesTags: ['ContentPage'],
    }),

    /* FAQs */
    getFaqs: builder.query<Faq[], void>({
      queryFn: endpoint({ mock: () => faqs.map((f) => ({ ...f })), real: () => '/cms/faqs' }),
      providesTags: ['Faq'],
    }),
    toggleFaq: builder.mutation<Faq, { id: ID; isPublished: boolean }>({
      queryFn: endpoint({
        mock: ({ id, isPublished }) => {
          const faq = faqs.find((f) => f.id === id)
          if (!faq) throw new Error('FAQ not found')
          faq.isPublished = isPublished
          return faq
        },
        real: ({ id, isPublished }) => ({ url: `/cms/faqs/${id}`, method: 'PATCH', body: { isPublished } }),
      }),
      async onQueryStarted({ id, isPublished }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cmsApi.util.updateQueryData('getFaqs', undefined, (draft) => {
            const faq = draft.find((f) => f.id === id)
            if (faq) faq.isPublished = isPublished
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
    createFaq: builder.mutation<Faq, FaqInput>({
      queryFn: endpoint({
        mock: (body) => {
          const created: Faq = { id: genId('faq'), ...body }
          faqs.push(created)
          return created
        },
        real: (body) => ({ url: '/cms/faqs', method: 'POST', body }),
      }),
      invalidatesTags: ['Faq'],
    }),
    updateFaq: builder.mutation<Faq, { id: ID } & FaqInput>({
      queryFn: endpoint({
        mock: ({ id, ...changes }) => {
          const faq = faqs.find((f) => f.id === id)
          if (!faq) throw new Error('FAQ not found')
          Object.assign(faq, changes)
          return faq
        },
        real: ({ id, ...body }) => ({ url: `/cms/faqs/${id}`, method: 'PUT', body }),
      }),
      invalidatesTags: ['Faq'],
    }),
    deleteFaq: builder.mutation<{ id: ID }, ID>({
      queryFn: endpoint({
        mock: (id) => {
          const idx = faqs.findIndex((f) => f.id === id)
          if (idx === -1) throw new Error('FAQ not found')
          faqs.splice(idx, 1)
          return { id }
        },
        real: (id) => ({ url: `/cms/faqs/${id}`, method: 'DELETE' }),
      }),
      invalidatesTags: ['Faq'],
    }),
  }),
})

export const {
  useGetBannersQuery,
  useToggleBannerMutation,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useGetContentPagesQuery,
  useUpdateContentPageMutation,
  useGetFaqsQuery,
  useToggleFaqMutation,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = cmsApi
