"use client"

import { classnames, toPusherKey } from '@/lib/utils'
import { Message } from '@/lib/validations/message'
import { FC, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'
import { pusherClient } from '@/lib/pusher'

interface MessagesProps {
  initialMessages: Message[]
  sessionId: string
  sessionImg: string | null | undefined
  chatPartner: User
  chatId: string
}

const Messages: FC<MessagesProps> = ({initialMessages, sessionId, sessionImg, chatId, chatPartner}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
        
    // REAL TIME
    // Subscribe to pusher channel
    useEffect(() => {
        pusherClient.subscribe(
            toPusherKey(`chat:${chatId}`)
        )
        console.log(`Subscribed to channel: chat:${chatId}`)

        const handleNewMessage = (message: Message) => {
            setMessages((prev) => [message, ...prev]);
        }

        pusherClient.bind('incoming_message', handleNewMessage)

        // clean up
        return () => {
            pusherClient.unsubscribe(
                toPusherKey(`chat:${chatId}`)
            )
            pusherClient.unbind('incoming_message', handleNewMessage)
        }
    }, [chatId])
    
    const scrollDownRef = useRef<HTMLDivElement | null>(null) // use to auto scroll when new message appears

    const formatTimestamp = (timestamp: number) => {
        return format(timestamp, 'HH:mm')
    }

  return (
    <div id='messages' className='flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'>  {/* Reverse is important for message order */}
        <div ref={scrollDownRef} />

        {messages.map((message, index) => {
            // Is message sent by us or chatpartner?
            const isCurrentUser = message.senderId === sessionId

            // Are there subsequent messages from the same user?
            const isNextMsgFromSameUser = messages[index - 1]?.senderId === messages[index].senderId

            return (
                <div key={`${message.id}-${message.timestamp}`} className='chat-message'>
                    <div 
                        className={classnames('flex items-end', {
                        'justify-end': isCurrentUser, // if isCurrentUser, 'justify-end' is merged with 'flex items-end'
                    })}>
                        <div className={classnames('flex flex-col space-y-2 text-base max-w-xs mx-2', {
                            'order-1 items-end': isCurrentUser,
                            'order-2 items-start': !isCurrentUser
                        })}>
                            <span className={classnames('px-4 py-2 rounded-lg inline-block', {
                                'bg-indigo-600 text-white': isCurrentUser,
                                'bg-gray-200 text-gray-900': !isCurrentUser,
                                'rounded-br-none': !isNextMsgFromSameUser && isCurrentUser,
                                'rounded-bl-none': !isNextMsgFromSameUser && !isCurrentUser,
                            })}>
                                {message.text}{''}
                                <span className='ml-2 text-xs text-gray-400'>
                                    {formatTimestamp(message.timestamp)}
                                </span>
                            </span>
                        </div>
                        <div className={classnames('relative w-6 h-6', {
                            'order-2': isCurrentUser, // messages on right, img after text
                            'order-1': !isCurrentUser, // messages on left, img before text
                            'invisible': isNextMsgFromSameUser
                        })}>
                            <Image 
                                fill
                                src={isCurrentUser ? (sessionImg as string) : chatPartner.image}
                                alt='profile picture'
                                referrerPolicy='no-referrer'
                                sizes='24px'
                                className='rounded-full'/>
                        </div>
                    </div>
                </div>
            )
        })}
    </div>
  )
}

export default Messages