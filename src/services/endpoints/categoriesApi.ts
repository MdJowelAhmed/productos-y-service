import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { categories } from '@/services/mock/seed'
import { genId } from '@/lib/utils'
import type { ID } from '@/types/common.types'
import type { Category, StoreType } from '@/types/models'

export interface CategoryInput {
  name: string
  type: StoreType
  isActive: boolean
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      // Return a fresh array so RTK Query re-renders after a toggle mutation.
      queryFn: endpoint({ mock: () => categories.map((c) => ({ ...c })), real: () => '/categories' }),
      providesTags: ['Category'],
    }),

    toggleCategory: builder.mutation<Category, { id: ID; isActive: boolean }>({
      queryFn: endpoint({
        mock: ({ id, isActive }) => {
          const cat = categories.find((c) => c.id === id)
          if (!cat) throw new Error('Category not found')
          cat.isActive = isActive
          return cat
        },
        real: ({ id, isActive }) => ({ url: `/categories/${id}`, method: 'PATCH', body: { isActive } }),
      }),
      // Optimistic update — the switch flips instantly, rolls back on error.
      async onQueryStarted({ id, isActive }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          categoriesApi.util.updateQueryData('getCategories', undefined, (draft) => {
            const cat = draft.find((c) => c.id === id)
            if (cat) cat.isActive = isActive
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    createCategory: builder.mutation<Category, CategoryInput>({
      queryFn: endpoint({
        mock: (body) => {
          const created: Category = {
            id: genId('cat'),
            name: body.name,
            type: body.type,
            listingCount: 0,
            isActive: body.isActive,
          }
          categories.push(created)
          return created
        },
        real: (body) => ({ url: '/categories', method: 'POST', body }),
      }),
      invalidatesTags: ['Category'],
    }),

    updateCategory: builder.mutation<Category, { id: ID } & CategoryInput>({
      queryFn: endpoint({
        mock: ({ id, ...changes }) => {
          const cat = categories.find((c) => c.id === id)
          if (!cat) throw new Error('Category not found')
          cat.name = changes.name
          cat.type = changes.type
          cat.isActive = changes.isActive
          return cat
        },
        real: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PUT', body }),
      }),
      invalidatesTags: ['Category'],
    }),

    deleteCategory: builder.mutation<{ id: ID }, ID>({
      queryFn: endpoint({
        mock: (id) => {
          const idx = categories.findIndex((c) => c.id === id)
          if (idx === -1) throw new Error('Category not found')
          categories.splice(idx, 1)
          return { id }
        },
        real: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      }),
      invalidatesTags: ['Category'],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useToggleCategoryMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi
