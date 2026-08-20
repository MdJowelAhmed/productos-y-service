import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { SupportMessage, SupportStatus, SupportTicket } from '@/types/models'

export const supportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSupportTickets: builder.query<Paginated<SupportTicket>, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        return {
          url: '/support/tickets',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<SupportTicket> => {
        const items = Array.isArray(response?.data) ? response.data : []
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['SupportTicket'],
    }),

    getSupportThread: builder.query<SupportMessage[], ID>({
      query: (ticketId) => ({
        url: `/support/tickets/${ticketId}/messages`,
        method: 'GET',
      }),
      transformResponse: (response: any): SupportMessage[] =>
        Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [],
      providesTags: (_r, _e, ticketId) => [{ type: 'SupportThread', id: ticketId }],
    }),

    sendSupportReply: builder.mutation<SupportMessage, { ticketId: ID; body: string }>({
      query: ({ ticketId, body }) => ({
        url: `/support/tickets/${ticketId}/reply`,
        method: 'POST',
        body: { body },
      }),
      transformResponse: (response: any) => response?.data || response,
      async onQueryStarted({ ticketId, body }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          supportApi.util.updateQueryData('getSupportThread', ticketId, (draft) => {
            draft.push({
              id: `optimistic_${draft.length}`,
              ticketId,
              sender: 'agent',
              body,
              sentAt: new Date().toISOString(),
            })
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['SupportTicket'],
    }),

    setSupportTicketStatus: builder.mutation<SupportTicket, { id: ID; status: SupportStatus }>({
      query: ({ id, status }) => ({
        url: `/support/tickets/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ['SupportTicket'],
    }),

    markSupportTicketRead: builder.mutation<SupportTicket, ID>({
      query: (id) => ({
        url: `/support/tickets/${id}/read`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ['SupportTicket'],
    }),
  }),
})

export const {
  useGetSupportTicketsQuery,
  useGetSupportThreadQuery,
  useSendSupportReplyMutation,
  useSetSupportTicketStatusMutation,
  useMarkSupportTicketReadMutation,
} = supportApi
