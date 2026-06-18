import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { banners, contentPages, faqs } from '@/services/mock/seed'
import { genId } from '@/lib/utils'
import type { ID } from '@/types/common.types'
import type { Banner, ContentPage, ContentStatus, Faq } from '@/types/models'

export interface UpdateContentPageRequest {
  id: ID
  title: string
  content: string
  status: ContentStatus
}

export type BannerInput = Omit<Banner, 'id'>
export type FaqInput = Omit<Faq, 'id'>

export const cmsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /* Banners */
    getBanners: builder.query<Banner[], void>({
      queryFn: endpoint({ mock: () => banners.map((b) => ({ ...b })), real: () => '/cms/banners' }),
      providesTags: ['Banner'],
    }),
    toggleBanner: builder.mutation<Banner, { id: ID; isActive: boolean }>({
      queryFn: endpoint({
        mock: ({ id, isActive }) => {
          const banner = banners.find((b) => b.id === id)
          if (!banner) throw new Error('Banner not found')
          banner.isActive = isActive
          return banner
        },
        real: ({ id, isActive }) => ({ url: `/cms/banners/${id}`, method: 'PATCH', body: { isActive } }),
      }),
      async onQueryStarted({ id, isActive }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cmsApi.util.updateQueryData('getBanners', undefined, (draft) => {
            const banner = draft.find((b) => b.id === id)
            if (banner) banner.isActive = isActive
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
    createBanner: builder.mutation<Banner, BannerInput>({
      queryFn: endpoint({
        mock: (body) => {
          const created: Banner = { id: genId('bnr'), ...body }
          banners.unshift(created)
          return created
        },
        real: (body) => ({ url: '/cms/banners', method: 'POST', body }),
      }),
      invalidatesTags: ['Banner'],
    }),
    updateBanner: builder.mutation<Banner, { id: ID } & BannerInput>({
      queryFn: endpoint({
        mock: ({ id, ...changes }) => {
          const banner = banners.find((b) => b.id === id)
          if (!banner) throw new Error('Banner not found')
          Object.assign(banner, changes)
          return banner
        },
        real: ({ id, ...body }) => ({ url: `/cms/banners/${id}`, method: 'PUT', body }),
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
        real: (id) => ({ url: `/cms/banners/${id}`, method: 'DELETE' }),
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
