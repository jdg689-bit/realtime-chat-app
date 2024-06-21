// Create a set with chatId as the key
// All messages go in this set

import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Message, messageValidator } from "@/lib/validations/message";
import { getServerSession } from "next-auth";
import { nanoid } from 'nanoid';
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

export async function POST(req: Request) {
    try {
        // process request body
        const {text, chatId}: {text:string, chatId: string} = await req.json();

        // user must be logged in to send message
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response('Unauthorized', {status: 401})
        }

        // Verify sender is one of the chat members
        const [chatId1, chatId2] = chatId.split('--');
    
        if (session.user.id !== chatId1 && session.user.id !== chatId2) {
            return new Response('Unauthorized', {status: 401})
        }

        // Determine which ID belongs to friend user
        const friendId = session.user.id === chatId1 ? chatId2 : chatId1


        // Verify that friendId is in users friend list
        const friendList = await fetchRedis('smembers', `user:${session.user.id}:friends`) as string[]

        const isFriend = friendList.includes(friendId)

        if (!isFriend) {
            return new Response ('Unauthorized', {status: 401})
        }

        // get sender information
        const senderData = await fetchRedis('get', `user:${session.user.id}`) as string
        const sender = JSON.parse(senderData) as User;

        // SEND MESSAGE
        // add message to Redis set
        const timestamp = Date.now()

        const messageData: Message = {
            id: nanoid(), // generate random ID
            senderId: session.user.id,
            text,
            timestamp
        }

        const message = messageValidator.parse(messageData);

        // TRIGGER REALTIME EVENTS
        pusherServer.trigger(toPusherKey(`chat:${chatId}`), 'incoming_message', message)

        pusherServer.trigger(toPusherKey(`user:${friendId}:chats`), 'new_message', {
            ...message, 
            senderImg: sender.image,
            senderName: sender.name
        })

        await db.zadd(`chat:${chatId}:messages`, {
            score: timestamp,
            member: JSON.stringify(message)
        });

        return new Response('OK')
        
    } catch (error) {

        if (error instanceof Error) {
            return new Response (error.message, {status: 500})
        }

        return new Response('Internal Server Error', {status:500})
        
    }
}