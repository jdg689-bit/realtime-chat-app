// Route to add friends
// Validate client email and get userId from redis server

import { fetchRedis } from "@/helpers/redis"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { addFriendValidator } from "@/lib/validations/add-friend"
import { getServerSession } from "next-auth"
import { z } from "zod"

export async function POST(req: Request) {
    try {
        const body = await req.json() // Get request body

        const {email: emailToAdd} = addFriendValidator.parse(body.email)
        // This destructures email from the addFriendValidator and renames it as emailToAdd
        // See Destructuring and assigning new variable names
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        
        // ****************************************
        // GET USER ID FROM DB USING EMAIL
        // This doesn't work due to NextJS caching behaviour, I've left it in for comparison
        /*
        const RESTResponse = await fetch(
            `${process.env.UPSTASH_REDIS_REST_URL}/get/user:email${emailToAdd}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
                },
                cache: 'no-store',
            }
        )

        const data = (await RESTResponse.json()) as { result: string | null } // explicit type assertion
        const idToAdd = data.result
        */

        // Using the helper function we made navigates the caching issue
        const idToAdd = await fetchRedis('get', `user:email:${emailToAdd}`) as string


                // DEBUGGING
                console.log('to add', idToAdd)

        if(!idToAdd) {
            // result == null
            return new Response('This person does not exist.', { status: 400 })
        }

        //** WHO IS SENDING THE REQUEST */
        // Don't want to send this from client -> unsafe
        const session = await getServerSession(authOptions) // docs: https://next-auth.js.org/configuration/nextjs
        
        if (!session) {
            return new Response('Unauthorized', {status: 401})
        }

        if(idToAdd === session.user.id) {
            // Cannot add self as friend
            return new Response('You cannot add yourself as a friend.', { status: 400 })
        }

        // Is the currently logged in user (session.user.id) a member of the incoming friend requests of the person we're trying to add?
        const isAlreadyAdded = await fetchRedis(
            'sismember', 
            `user:${idToAdd}:incoming_friend_requests`, // REVIEW: NOT SURE WHERE THIS CAME FROM - MUST BE A REDIS THING
            session.user.id
        ) as 0 | 1

        if (isAlreadyAdded) {
            return new Response('Aready added this user', { status: 400 })
        }

        // Is user already friends with requested user
        const isAlreadyFriends = await fetchRedis(
            'sismember', 
            `user:${session.user.id}:friends`, 
            idToAdd
        ) as 0 | 1

        if (isAlreadyFriends) {
            return new Response('Aready friends with this user', { status: 400 })
        }

        // valid request, send friend request
        db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id)

        return new Response('OK')

    } catch (error) {
        if(error instanceof z.ZodError) {
            return new Response('Invalud request payload', { status: 422 }) // unprocessable entity
        }    

        return new Response('Invalid request', { status: 400 })
    }
}