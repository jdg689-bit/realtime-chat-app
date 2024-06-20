import { fetchRedis } from "./redis"

export const getFriendsById = async (userId: string) => {
    const friendIds = await fetchRedis('smembers', `user:${userId}:friends`) as string[]

    const friends = await Promise.all(friendIds.map(async (friendId) => {
        // Get all information about friend
        const friendData = await fetchRedis('get', `user:${friendId}`) as string
        const friend = JSON.parse(friendData) as User

        return friend
    }))

    return friends;
}