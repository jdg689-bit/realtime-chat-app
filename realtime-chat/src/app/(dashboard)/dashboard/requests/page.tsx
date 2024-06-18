// This is where you view your pending friend requests...

import FriendRequests from '@/components/FriendRequests'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { FC } from 'react'


const page = async ({}) => {
    const session = await getServerSession(authOptions)
    if(!session) notFound()

    // get ids of people who have sent friend requests
    const incomingRequestIds = await fetchRedis(
        'smembers',
        `user:${session.user.id}:incoming_friend_requests`
    ) as string[]

    const incomingFriendRequests = await Promise.all(
        incomingRequestIds.map(async (senderId) => {
            const senderData = await fetchRedis(
                'get',
                `user:${senderId}`
            ) as string

            const sender = JSON.parse(senderData) as User
            
            return {
                senderId,
                senderEmail: sender.email
            }
        })
    )

    console.log(incomingFriendRequests)

  return (
    <main className='pt-8'>
        <h1 className='font-bold text-5xl mb-8'>Add a friend</h1>
        <div className='flex flex-col gap-4'>
            {/* Requests must be a client component for realtime functionality */}
            <FriendRequests 
                incomingFriendRequests={incomingFriendRequests}
                sessionId={session.user.id}
            />
        </div>
    </main>
  )
}

export default page