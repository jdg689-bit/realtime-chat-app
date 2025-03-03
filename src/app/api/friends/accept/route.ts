// Add new friend ID to :accepted_friends set

import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db"
import { pusherClient, pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { z } from "zod";


export async function POST(req: Request) {
    
    try {

        const body = await req.json();

        // Validate idToAdd is a string
        const {id: idToAdd} = z.object({id: z.string()}).parse(body)

        // Don't want anyone to be able to make POST requests to this end point directly
        // Malicious user could add themselves as your friend without needing an accepted request
        const session = await getServerSession(authOptions);

        if (!session) {
            // Can't accept request if not logged in
            return new Response('Unauthorized', {status:401})
        }

        // Check if users are already friends
        const isAlreadyFriends = await fetchRedis('sismember', `user:${session.user.id}:friends`, idToAdd);

        if (isAlreadyFriends) {
            return new Response('Already friends', {status:400})
        }

        // Can only add friend if there was a pending request
        const hasFriendRequest = await fetchRedis('sismember', `user:${session.user.id}:incoming_friend_requests`, idToAdd)

        if (!hasFriendRequest) {
            return new Response('No pending friend request.', {status:400})
        }

        const [userRaw, friendRaw] = (await Promise.all([
            fetchRedis('get', `user:${session.user.id}`),
            fetchRedis('get', `user:${idToAdd}`),
        ])) as [string, string]

        const user = JSON.parse(userRaw) as User
        const friend = JSON.parse(friendRaw) as User

        await Promise.all([
            // Trigger realtime event, notify user of accepted request
            pusherServer.trigger(toPusherKey(`user:${idToAdd}:friends`), 'new_friend', user),
            pusherServer.trigger(toPusherKey(`user:${session.user.id}:friends`), 'new_friend', friend),

            // ADD FRIEND
            // Add idToAdd to users friend set
            await db.sadd(`user:${session.user.id}:friends`, idToAdd),

            // Add user to idToAdds friend set
            await db.sadd(`user:${idToAdd}:friends`, session.user.id),

            // Remove users from one another's friend request sets
            await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd),
        ])

        return new Response('OK')
        
    } catch (error) {
        if(error instanceof z.ZodError) {
            return new Response('Invalid request payload', {status:422})
        }

        return new Response('Invalid request', {status:400})
    }
}