// Define custom next-auth values in here

import type { Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

type UserId = string;

// Declaring modules so we get some intellisense in our auth.ts file

declare module 'next-auth/jwt' {
    interface JWT {
        id: UserId
    }
}

declare module 'next-auth' {
    // & adds id to the existing User object (see db.d.ts)
    interface Session {
        user: User & { 
            id: UserId
        }
    }
}