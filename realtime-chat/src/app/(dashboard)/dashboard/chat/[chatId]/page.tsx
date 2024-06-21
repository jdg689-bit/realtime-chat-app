// This is a dynamic page, which retrieves the appropriate chat from the url and displays that chat
// eg. dashboard/chat/jakes-chat will display jakes chat
// declare a dynamic page segment using [] in folder structure

import ChatInput from '@/components/ChatInput'
import Messages from '@/components/Messages'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { messageArrayValidator } from '@/lib/validations/message'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { FC, useEffect } from 'react'

interface PageProps {
  params: {
    chatId: string
  }
}

async function getChatMessages(chatId: string) {
  try {
    const results: string[] = await fetchRedis(
      'zrange',
      `chat:${chatId}:messages`,
      0, -1 // fetch all messages
    )

    const dbMessages = results.map((message) => JSON.parse(message) as Message)

    // display most recent message at the bottom of the chat
    const reversedDbMessages = dbMessages.reverse()

    // validate messages
    const messages = messageArrayValidator.parse(reversedDbMessages);

    return messages
  } catch (error) {
      notFound()
  }
}

const page = async ({params}: PageProps) => {

  const { chatId } = params // extracts the chatId property from params and assigns it to chatId
  const session = await getServerSession(authOptions)

  if (!session) notFound()

  const { user } = session

  const [userId1, userId2] = chatId.split('--')

  // user can only view chat if one of the chatIds is theirs
  if(user.id !== userId1 && user.id !== userId2) {
    notFound()
  }

  const chatPartnerId = (user.id === userId1) ? userId2 : userId1
  const chatPartnerData = await fetchRedis('get', `user:${chatPartnerId}`) as string
  const chatPartner = JSON.parse(chatPartnerData) as User
  
  // Retrieve existing messages for this chat
  const initialMessages = await getChatMessages(chatId)

  return (
    <div className='flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]'>
      <div className='flex sm:items-center justify-between py-3 border-b-2 border-gray-200'>
        <div className='relative flex items-center space-x-4'>
          <div className='relative'>
            <div className='relative w-8 sm:w-12 h-8 sm:h-12'>
              <Image 
                fill
                sizes='32px'
                referrerPolicy='no-referrer'
                src={chatPartner.image}
                alt={`${chatPartner.name} profile picture`}
                className='rounded-full'
              />
            </div>
          </div>

          <div className='flex flex-col leading-tight'>
            <div className='text-xl flex items-center'>
              <span className='text-gray-700 mr-3 font-semibold'>{chatPartner.name}</span>
            </div>
            <span className='text-sm text-gray-600'>{chatPartner.email}</span>
          </div>
        </div>
      </div>
      <Messages 
        initialMessages={initialMessages} 
        sessionId={session.user.id} 
        sessionImg={session.user.image}
        chatId={chatId}
        chatPartner={chatPartner} />
      <ChatInput chatPartner={chatPartner} chatId={chatId} />
    </div>
  )
}

export default page