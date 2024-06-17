// This file is responsible for all the authentication we do in the app

import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { db } from "./db";
import GoogleProvider from "next-auth/providers/google"

function getGoogleCredentials() {
    // Get provider variables used below
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || clientId.length === 0) {
        throw new Error('Missing GOOGLE_CLIENT_ID')
    }

    if (!clientSecret || clientSecret.length === 0) {
        throw new Error('Missing GOOGLE_CLIENT_SECRET')
    }

    return {clientId, clientSecret}

}

export const authOptions: NextAuthOptions = { // typescript syntax specifying that authOptions must conform to NextAuthOptions type (assigning a type to the constant authOptions)
    // all of these options can be explored at https://next-auth.js.org/configuration/options
    
    adapter: UpstashRedisAdapter(db), // This is updating the upstash db when a user logs in
    session: {
        strategy: 'jwt' // JSON Web Token
    },
    pages: {
        signIn: '/login'
    },
    providers: [
        GoogleProvider({
            clientId: getGoogleCredentials().clientId,
            clientSecret: getGoogleCredentials().clientSecret
        }),
    ],
    callbacks: {
        async jwt ({token, user}) {
            const dbUser = (await db.get(`user:${token.id}`)) as User | null // Check whether this is a new user

            if (!dbUser) {
                token.id = user!.id
                return token
            }

            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image,
            }
        },
        async session({session, token}) {
            if(token) {
                session.user.id = token.id
                session.user.name = token.name
                session.user.email = token.email
                session.user.image = token.picture
            }

            return session
        },
        redirect() {
            return '/dashboard'
        }
    }
}