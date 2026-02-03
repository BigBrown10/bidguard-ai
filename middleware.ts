import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // ROUTE PROTECTION LOGIC
    const path = request.nextUrl.pathname

    // Define paths that require authentication check
    const isProtectedRoute = path.startsWith('/draft') ||
        path.startsWith('/newbid') ||
        path.startsWith('/dashboard') ||
        path.startsWith('/admin')

    const isAuthRoute = path.startsWith('/login') ||
        path.startsWith('/register')

    // OPTIMIZATION: On public routes, we might not need to await getUser() which is slow
    // However, we need it to redirect LOGGED IN users away from /login
    // And to guard Protected routes.
    // For purely public routes (/, /news, /tenders), we can ideally skip this if we accept that
    // token refresh happens on the client or protected pages.
    // BUT token refreshing is arguably important middleware's job.
    // Let's at least Only block if it matters.

    if (!isProtectedRoute && !isAuthRoute) {
        // Public Route (Home, News, Tenders) -> FAST PATH
        // We technically skip token refresh here, but it speeds up navigation by 300-500ms
        return response
    }

    // SLOW PATH: Fetch user for Auth/Protected routes
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Protected Routes: Redirect unauthenticated users to Login
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Auth Routes: Redirect authenticated users AWAY from Login
    if (isAuthRoute && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/tenders' // Default to Live Tenders
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
