import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { z } from "zod"

export async function POST(req: Request) {
    try {
        // Get requester userId from req body
        const body = await req.json()

        // Validate request body type
        const {id: idToReject} = z.object({id: z.string()}).parse(body); // parses body to Zod schema for validation

        // Get session
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response('Unauthorized', {status:400})
        }

        // Remove friend request
        await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToReject);

        return new Response('OK');
        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response('Invalid request payload', {status:422})
        }

        return new Response('Invalid request', {status:400})
    }
}