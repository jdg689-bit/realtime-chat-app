// Naming of this file MUST be middleware.ts

import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import path from "path";

export default withAuth(
    async function middleware(req) {
        // determine path user has requested
        const pathname = req.nextUrl.pathname

        // Manage route protection
        // Is user already authenticated
        const isAuth = await getToken({req})
        const isLoginPage = pathname.startsWith('/login')

        // user should not be able to access sensitive routes unless logged in
        const sensitiveRoutes = ['/dashboard']
        const isAccessingSensitiveRoute = sensitiveRoutes.some((route) => pathname.startsWith(route))

        if(isLoginPage) {
            if(isAuth) {
                // If logged in, redirect to dashboard
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }

            // else forward to log in page
            return NextResponse.next()
        }

        // If not logged in and trying to access sensitive pages, redirect to log in
        if (!isAuth && isAccessingSensitiveRoute) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
        if (pathname === '/') {
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }, {
        callbacks: {
            // work-around for handling redirects on nextauth pages
            // prevents infinite redirect error
            async authorized() {
                return true
            }
        }
    }
)

export const config = {
    // use matcher to define for which routes this middleware will run
    matcher: ['/', '/login', '/dashboard/:path*']
}