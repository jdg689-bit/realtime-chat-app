interface User {
    name: string
    email: string
    image: string
    id: string
}

interface Chat {
    id: string
    messages: Message[]
}

interface Message {
    id: string
    senderId: string
    recipientId: string
    text: string
    timestamp: number
}

// This is for realtime functionality
interface FriendRequest {
    id: string
    senderId: string
    recipientId: string
}