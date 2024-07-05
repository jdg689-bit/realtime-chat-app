// type IncomingFriendRequest[] is defined in pusher.d.ts
"use client"

import { pusherClient } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import axios from 'axios'
import { Check, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

interface FriendRequestsProps {
  incomingFriendRequests: IncomingFriendRequest[]
  sessionId: string
}

const FriendRequests: FC<FriendRequestsProps> = ({
    incomingFriendRequests,
    sessionId
}) => {
    const router = useRouter() // used later to refresh page
    const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(
        incomingFriendRequests
    )

    // SUBSCRIBE TO REALTIME EVENTS
    // Shows pending friend request count in real time
    useEffect(() => {
        pusherClient.subscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))
        console.log(`subscribed to channel: ${toPusherKey(`user:${sessionId}:incoming_friend_requests`)}`)

        const friendRequestHandler = ({senderId, senderEmail}: IncomingFriendRequest) => {
            // update friend requests state
            setFriendRequests((prev) => [...prev, {senderId, senderEmail}])
            console.log(`Friend requests: ${friendRequests}`);
        }

        // listen for the incoming_friend_requests event, this is defined on pusherServer
        pusherClient.bind('incoming_friend_requests', friendRequestHandler)

        return () => {
            //clean up
            pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))
            pusherClient.unbind('incoming_friend_requests', friendRequestHandler)
        }
    }, [sessionId, friendRequests])

    const acceptFriend = async (senderId: string) => {
        await axios.post('/api/friends/accept', { id: senderId })

        // No longer show this friend in the requests list
        setFriendRequests((prev) => (
            // Note setState can also take an arrow func where the paramter is the current state 
            prev.filter((request) => request.senderId !== senderId)
        ))

        router.refresh()
    }

    const rejectFriend = async (senderId: string) => {
        await axios.post('/api/friends/reject', { id: senderId })

        setFriendRequests((prev) => ( 
            prev.filter((request) => request.senderId !== senderId)
        ))

        router.refresh()
    }

    return (
        <>
            {friendRequests.length === 0 ? (
                <p className='text-sm text-zinc-500'>Nothing to show here...</p>
            ) : (
                friendRequests.map((request) => {
                    return (
                        <div key={request.senderId} className='flex gap-4 items-center'>
                            <UserPlus className='text-black' />
                            <p className='font-medium text-lg'>{request.senderEmail}</p>
                            <button 
                                aria-label='accept-friend' 
                                className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md'
                                onClick={() => acceptFriend(request.senderId)}>
                                <Check className='font-semibold text-white w-3/4 h-3/4' />
                            </button>
                            <button 
                                aria-label='reject-friend' 
                                className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md'
                                onClick={() => rejectFriend(request.senderId)}>
                                <X className='font-semibold text-white w-3/4 h-3/4' />
                            </button>
                        </div>
                    )
                })
            )}
        </>
    )
}

export default FriendRequests

/*
The 'same' code in JS

const FriendRequests = ({ incomingFriendRequests, sessionId }) => {
    const [FriendRequests, setFriendRequests] = useState(incomingFriendRequests);

    return <div>FriendRequests</div>
}
    */