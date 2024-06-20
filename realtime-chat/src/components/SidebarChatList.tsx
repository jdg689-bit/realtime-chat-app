"use client"

import { chatHrefConstructor } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

interface SidebarChatListProps {
  friends: User[]
  sessionId: string
}

const SidebarChatList: FC<SidebarChatListProps> = ({sessionId, friends}) => {
  // router will be used to check if user visits chat path (i.e. views unseen messages)
  const router = useRouter()
  const pathname = usePathname()

  // because this is only a state, you will not see a count for new messages received when offline
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([])

  // useEffect to check if pathname has been visited
  // recall effects are triggered when dependencies change
  useEffect(() => {
    if (pathname?.includes('chat')) {
      // user is viewing a chat
      setUnseenMessages((prev) => {
        // remove unseen messages in chat from state
        return prev.filter((msg) => !pathname.includes(msg.senderId))
      })
    }
  }, [pathname])

  return (
    <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 space-y-1'>
        {friends.sort().map((friend) => {
          const unseenMessagesCount = unseenMessages.filter((msg) => msg.senderId === friend.id).length
          return (
            <li key={friend.id}>
              <a href={`/dashboard/chat/${chatHrefConstructor(
                sessionId,
                friend.id
              )}`}
              className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'>
                {friend.name}
                {unseenMessagesCount > 0 ? (
                  <div className='bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center'>{unseenMessagesCount}</div>
                ) : null}
              </a>
            </li>
          )
        })}
    </ul>
  )
}

export default SidebarChatList