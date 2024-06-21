import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function classnames(...inputs: ClassValue[]) { 
    // uses clsx and tailwind-merge dependencies
    return twMerge(clsx(inputs));
}


export function chatHrefConstructor (id1: string, id2: string) {
    // using your id and chat partners id, generates path for chat
    const sortedIds = [id1, id2].sort()
    return `${sortedIds[0]}--${sortedIds[1]}`
}


export function toPusherKey(key: string) {
    // Pusher doesn't accept : in the key name, eg. user:${sessionId}:incoming_friends
    return key.replace(/:/g, '__')
}