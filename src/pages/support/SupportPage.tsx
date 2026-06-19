import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowLeft, CheckCircle2, LifeBuoy, RotateCcw, Send } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/shared/Avatar'
import { SearchInput } from '@/components/shared/SearchInput'
import { SupportStatusBadge } from '@/components/shared/StatusBadge'
import { SUPPORT_STATUS_OPTIONS } from '@/components/shared/filterOptions'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useGetSupportTicketsQuery,
  useGetSupportThreadQuery,
  useSendSupportReplyMutation,
  useSetSupportTicketStatusMutation,
  useMarkSupportTicketReadMutation,
} from '@/services/endpoints/supportApi'
import { formatRelative, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SupportTicket } from '@/types/models'

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [activeId, setActiveId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search)
  const { data, isLoading } = useGetSupportTicketsQuery({ search: debouncedSearch, status, pageSize: 100 })
  const tickets = data?.items ?? []

  const active = tickets.find((t) => t.id === activeId) ?? null

  return (
    <div>
      <PageHeader
        title="Customer Support"
        description="Messages from buyers and sellers land here — reply to help them out."
      />

      <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
        {/* Inbox list */}
        <div
          className={cn(
            'w-full flex-col border-r border-ink-100 lg:flex lg:w-80 xl:w-96',
            active ? 'hidden lg:flex' : 'flex',
          )}
        >
          <div className="space-y-3 border-b border-ink-100 p-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search conversations…" />
            <Select options={SUPPORT_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : tickets.length === 0 ? (
              <EmptyState icon={LifeBuoy} title="No conversations" description="You're all caught up." />
            ) : (
              tickets.map((t) => (
                <TicketRow key={t.id} ticket={t} active={t.id === activeId} onClick={() => setActiveId(t.id)} />
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className={cn('flex-1 flex-col', active ? 'flex' : 'hidden lg:flex')}>
          {active ? (
            <Conversation ticket={active} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                icon={LifeBuoy}
                title="Select a conversation"
                description="Choose a ticket from the inbox to read and reply."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TicketRow({ ticket, active, onClick }: { ticket: SupportTicket; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-ink-50 p-4 text-left transition-colors hover:bg-ink-50',
        active && 'bg-brand-50/60',
      )}
    >
      <Avatar name={ticket.customerName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-ink-900">{ticket.customerName}</p>
          <span className="shrink-0 text-xs text-ink-400">{formatRelative(ticket.lastMessageAt)}</span>
        </div>
        <p className="truncate text-sm font-medium text-ink-700">{ticket.subject}</p>
        <p className="truncate text-xs text-ink-500">{ticket.lastMessage}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <SupportStatusBadge status={ticket.status} />
          {ticket.unread > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {ticket.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function Conversation({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const { data: messages, isFetching } = useGetSupportThreadQuery(ticket.id)
  const [sendReply, { isLoading: sending }] = useSendSupportReplyMutation()
  const [setStatus] = useSetSupportTicketStatusMutation()
  const [markRead] = useMarkSupportTicketReadMutation()
  const [body, setBody] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Opening a conversation marks it read.
  useEffect(() => {
    if (ticket.unread > 0) markRead(ticket.id)
  }, [ticket.id, ticket.unread, markRead])

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const text = body.trim()
    if (!text) return
    setBody('')
    await sendReply({ ticketId: ticket.id, body: text })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-100 p-4">
        <button onClick={onBack} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={ticket.customerName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-900">{ticket.customerName}</p>
          <p className="truncate text-xs text-ink-500">
            {ticket.subject} · {ticket.customerEmail}
          </p>
        </div>
        <SupportStatusBadge status={ticket.status} />
        {ticket.status === 'resolved' ? (
          <Button size="sm" variant="outline" onClick={() => setStatus({ id: ticket.id, status: 'open' })}>
            <RotateCcw className="h-3.5 w-3.5" /> Reopen
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setStatus({ id: ticket.id, status: 'resolved' })}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-ink-50/40 p-4">
        {isFetching && !messages ? (
          <LoadingState />
        ) : (
          messages?.map((m) => {
            const fromAgent = m.sender === 'agent'
            return (
              <div key={m.id} className={cn('flex', fromAgent ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[78%]', fromAgent ? 'text-right' : 'text-left')}>
                  <div
                    className={cn(
                      'inline-block rounded-2xl px-3.5 py-2 text-sm',
                      fromAgent ? 'bg-brand-600 text-white' : 'bg-white text-ink-900 ring-1 ring-ink-100',
                    )}
                  >
                    {m.body}
                  </div>
                  <p className="mt-1 px-1 text-[11px] text-ink-400">
                    {fromAgent ? 'You' : ticket.customerName} · {formatDateTime(m.sentAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-ink-100 p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type your reply…  (Enter to send, Shift+Enter for a new line)"
          className="scrollbar-thin max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
        <Button type="submit" loading={sending} disabled={!body.trim()} className="h-11 shrink-0">
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>
    </>
  )
}
