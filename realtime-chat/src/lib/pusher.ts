// Uses Pusher service for realtime communication

import PusherServer from "pusher"
import PusherClient from "pusher-js"

// Define server
// ! is non-null assertion operator, tells compiler 'this expression cannot be null'
export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: 'ap4',
    useTLS: true
})

// Define client
export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    {
        cluster: 'ap4'
    }
)

