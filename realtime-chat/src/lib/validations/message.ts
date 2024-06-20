// validate messages
// this ensures when working with them, that they are in the expected format

import { z } from "zod";

// validate single message
export const messageValidator = z.object({
    id: z.string(),
    senderId: z.string(),
    // recipientId: z.string(),
    text: z.string(),
    timestamp: z.number()
})

// validate all messages
export const messageArrayValidator = z.array(messageValidator)

// unsure why you do this when Message is already an interface in db.d.ts
export type Message = z.infer<typeof messageValidator>