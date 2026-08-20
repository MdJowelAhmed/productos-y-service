import { useEffect } from 'react'
import { getSocket } from '@/services/socket'
import { useAppDispatch } from '@/store/hooks'
import { supportApi } from '@/services/endpoints/supportApi'
import { useAuth } from '@/hooks/useAuth'

export function useSocketEvents(activeChatId?: string | null) {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const userId = user?.id || (user as any)?._id

  useEffect(() => {
    if (!userId) return

    const socket = getSocket()

    const handleNewChat = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleChatDeleted = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleNewMessage = (data: any) => {
      const msg = data?.message || data?.data || data
      if (!msg) return
      const chatId = String(msg?.chatId || msg?.chat || '')

      if (chatId) {
        dispatch(
          supportApi.util.updateQueryData('getMessages', { chatId, page: 1, limit: 20 }, (draft) => {
            const exists = draft.messages.some((m) => String(m.id || m._id) === String(msg._id || msg.id))
            if (!exists) {
              draft.messages.push({
                id: String(msg._id || msg.id || ''),
                _id: msg._id || msg.id,
                chatId,
                sender: msg.sender || '',
                text: msg.text || '',
                image: msg.image || '',
                read: Boolean(msg.read),
                type: msg.type || 'text',
                createdAt: msg.createdAt || new Date().toISOString(),
                updatedAt: msg.updatedAt,
              })
              draft.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            }
          }),
        )
      }

      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleUnreadCountUpdate = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleChatListUpdate = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const newChatEvent = `newChat::${userId}`
    const chatDeletedEvent = `chatDeletedForUser::${userId}`
    const newMessageEvent = `newMessage::${userId}`
    const unreadCountEvent = `unreadCountUpdate::${userId}`
    const chatListEvent = `chatListUpdate::${userId}`

    socket.on(newChatEvent, handleNewChat)
    socket.on(chatDeletedEvent, handleChatDeleted)
    socket.on(newMessageEvent, handleNewMessage)
    socket.on(unreadCountEvent, handleUnreadCountUpdate)
    socket.on(chatListEvent, handleChatListUpdate)

    return () => {
      socket.off(newChatEvent, handleNewChat)
      socket.off(chatDeletedEvent, handleChatDeleted)
      socket.off(newMessageEvent, handleNewMessage)
      socket.off(unreadCountEvent, handleUnreadCountUpdate)
      socket.off(chatListEvent, handleChatListUpdate)
    }
  }, [userId, activeChatId, dispatch])
}
