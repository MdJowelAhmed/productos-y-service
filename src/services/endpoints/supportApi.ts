import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import { paginate } from '@/services/mock/db'
import { supportMessages, supportTickets } from '@/services/mock/seed'
import { genId } from '@/lib/utils'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { SupportMessage, SupportStatus, SupportTicket } from '@/types/models'

export const supportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSupportTickets: builder.query<Paginated<SupportTicket>, ListParams>({
      queryFn: endpoint({
        mock: (params) =>
          paginate(supportTickets, params, {
            searchable: ['customerName', 'customerEmail', 'subject', 'lastMessage'],
            filters: { status: (t, v) => t.status === v },
          }),
        real: (params) => ({ url: '/support/tickets', params }),
      }),
      providesTags: ['SupportTicket'],
    }),

    getSupportThread: builder.query<SupportMessage[], ID>({
      queryFn: endpoint({
        mock: (ticketId) =>
          supportMessages
            .filter((m) => m.ticketId === ticketId)
            .sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
        real: (ticketId) => `/support/tickets/${ticketId}/messages`,
      }),
      providesTags: (_r, _e, ticketId) => [{ type: 'SupportThread', id: ticketId }],
    }),

    sendSupportReply: builder.mutation<SupportMessage, { ticketId: ID; body: string }>({
      queryFn: endpoint({
        mock: ({ ticketId, body }) => {
          const ticket = supportTickets.find((t) => t.id === ticketId)
          if (!ticket) throw new Error('Ticket not found')
          const message: SupportMessage = {
            id: genId('msg'),
            ticketId,
            sender: 'agent',
            body,
            sentAt: new Date().toISOString(),
          }
          supportMessages.push(message)
          ticket.lastMessage = body
          ticket.lastMessageAt = message.sentAt
          ticket.messageCount += 1
          ticket.unread = 0
          if (ticket.status === 'open') ticket.status = 'pending'
          return message
        },
        real: ({ ticketId, body }) => ({
          url: `/support/tickets/${ticketId}/reply`,
          method: 'POST',
          body: { body },
        }),
      }),
      // Instantly append the agent bubble to the open thread.
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
      queryFn: endpoint({
        mock: ({ id, status }) => {
          const ticket = supportTickets.find((t) => t.id === id)
          if (!ticket) throw new Error('Ticket not found')
          ticket.status = status
          if (status === 'resolved') ticket.unread = 0
          return ticket
        },
        real: ({ id, status }) => ({ url: `/support/tickets/${id}/status`, method: 'PATCH', body: { status } }),
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    markSupportTicketRead: builder.mutation<SupportTicket, ID>({
      queryFn: endpoint({
        mock: (id) => {
          const ticket = supportTickets.find((t) => t.id === id)
          if (!ticket) throw new Error('Ticket not found')
          ticket.unread = 0
          return ticket
        },
        real: (id) => ({ url: `/support/tickets/${id}/read`, method: 'POST' }),
      }),
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
