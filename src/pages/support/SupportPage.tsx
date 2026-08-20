import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowLeft, Image as ImageIcon, LifeBuoy, Send, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/shared/Avatar'
import { SearchInput } from '@/components/shared/SearchInput'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/useAuth'
import { imageUrl } from '@/components/shared/getImageUrl'
import {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkSupportTicketReadMutation,
} from '@/services/endpoints/supportApi'
import { formatRelative, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Chat, ChatParticipant, ChatMessage } from '@/types/models'

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search)
  const { data: chatsList, isLoading } = useGetChatsQuery()
  const chats = chatsList ?? []

  const filteredChats = chats.filter((c) => {
    if (!debouncedSearch.trim()) return true
    const term = debouncedSearch.toLowerCase()
    const pName = c.participants?.some((p) => p.name?.toLowerCase().includes(term))
    const lastMsg = c.lastMessage?.text?.toLowerCase().includes(term)
    return pName || lastMsg
  })

  const activeChat = chats.find((c) => c.id === activeId || c._id === activeId) ?? null

  return (
    <div>
      <PageHeader
        title="Customer Support & Chat"
        description="Live messaging and conversations with marketplace users, buyers, and sellers."
      />

      <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
        {/* Inbox List */}
        <div
          className={cn(
            'w-full flex-col border-r border-ink-100 lg:flex lg:w-80 xl:w-96',
            activeChat ? 'hidden lg:flex' : 'flex',
          )}
        >
          <div className="border-b border-ink-100 p-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search chats…" />
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : filteredChats.length === 0 ? (
              <EmptyState icon={LifeBuoy} title="No conversations" description="You're all caught up." />
            ) : (
              filteredChats.map((c) => (
                <ChatRow
                  key={c.id || c._id}
                  chat={c}
                  active={c.id === activeId || c._id === activeId}
                  onClick={() => setActiveId(c.id || c._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className={cn('flex-1 flex-col', activeChat ? 'flex' : 'hidden lg:flex')}>
          {activeChat ? (
            <Conversation chat={activeChat} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                icon={LifeBuoy}
                title="Select a conversation"
                description="Choose a chat from the inbox to read and reply."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatRow({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  const counterparty =
    chat.participants?.find((p) => p.role !== 'super_admin' && p.role !== 'admin') ||
    chat.participants?.[0]

  const name = counterparty?.name || 'Customer'
  const lastMsgText = chat.lastMessage?.text || 'No messages yet'
  const time = chat.lastMessage?.createdAt || chat.updatedAt || chat.createdAt

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-ink-50 p-4 text-left transition-colors hover:bg-ink-50',
        active && 'bg-brand-50/60',
      )}
    >
      <Avatar name={name} src={counterparty?.profileImage} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-ink-900">{name}</p>
          {time && <span className="shrink-0 text-xs text-ink-400">{formatRelative(time)}</span>}
        </div>
        <p className="truncate text-xs text-ink-500">{lastMsgText}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {chat.communicationType && (
            <span className="inline-block rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-700 capitalize">
              {chat.communicationType}
            </span>
          )}
          {Boolean(chat.unreadCount && chat.unreadCount > 0) && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function Conversation({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const { user } = useAuth()
  const chatId = chat.id || chat._id
  const { data: messages, isFetching } = useGetMessagesQuery(chatId)
  const [sendMessageApi, { isLoading: sending }] = useSendMessageMutation()
  const [markRead] = useMarkSupportTicketReadMutation()

  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const counterparty =
    chat.participants?.find((p) => p.role !== 'super_admin' && p.role !== 'admin') ||
    chat.participants?.[0]

  const customerName = counterparty?.name || 'Customer'
  const customerEmail = counterparty?.email || ''

  useEffect(() => {
    if (chat.unreadCount && chat.unreadCount > 0) {
      markRead(chatId)
    }
  }, [chatId, chat.unreadCount, markRead])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeFile = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed && !selectedFile) return

    const currentText = trimmed
    const currentFile = selectedFile

    setText('')
    setSelectedFile(null)
    setImagePreview(null)

    await sendMessageApi({
      chatId,
      text: currentText,
      imageFile: currentFile,
    })
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
        <Avatar name={customerName} src={counterparty?.profileImage} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-900">{customerName}</p>
          {customerEmail && <p className="truncate text-xs text-ink-500">{customerEmail}</p>}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-ink-50/40 p-4">
        {isFetching && !messages ? (
          <LoadingState />
        ) : (
          messages?.map((m: ChatMessage) => {
            const senderObj = typeof m.sender === 'object' ? (m.sender as ChatParticipant) : null
            const senderId = senderObj ? String(senderObj._id || '') : String(m.sender || '')
            const senderRole = senderObj?.role || ''

            const isAgent =
              (user?.id && senderId === String(user.id)) ||
              (user?.email && senderObj?.email === user.email) ||
              senderRole === 'super_admin' ||
              senderRole === 'admin' ||
              m.sender === 'agent' ||
              m.sender === 'me'

            const senderName = isAgent ? 'You' : (senderObj?.name || customerName)
            const imgPath = m.image ? imageUrl(m.image) : ''

            return (
              <div key={m.id || m._id} className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[78%]', isAgent ? 'text-right' : 'text-left')}>
                  <div
                    className={cn(
                      'inline-block rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                      isAgent
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-white text-ink-900 ring-1 ring-ink-100 rounded-bl-none',
                    )}
                  >
                    {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                    {imgPath && (
                      <img
                        src={imgPath}
                        alt="Attachment"
                        className="mt-2 max-h-60 max-w-xs rounded-lg object-cover border border-black/10"
                      />
                    )}
                  </div>
                  <p className="mt-1 px-1 text-[11px] text-ink-400">
                    {senderName} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="border-t border-ink-100 p-3 space-y-2">
        {imagePreview && (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Upload preview" className="h-16 w-16 rounded-lg object-cover border border-ink-200" />
            <button
              type="button"
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
            title="Attach image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
            className="scrollbar-thin max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
          />
          <Button
            type="submit"
            loading={sending}
            disabled={!text.trim() && !selectedFile}
            className="h-11 shrink-0"
          >
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </form>
    </>
  )
}
