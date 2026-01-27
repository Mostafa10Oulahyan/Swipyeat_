import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    console.log('[MIDDLEWARE] updateSession called for:', request.nextUrl.pathname)

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    const cookies = request.cookies.getAll()
                    console.log('[MIDDLEWARE] getAll cookies:', cookies.map(c => c.name))
                    return cookies
                },
                setAll(cookiesToSet) {
                    console.log('[MIDDLEWARE] setAll cookies:', cookiesToSet.map(c => c.name))
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do not remove this!
    // This is what refreshes the auth token and gets the user
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
        console.log('[MIDDLEWARE] getUser error:', error.message)
    } else {
        console.log('[MIDDLEWARE] getUser result:', user ? `User ID: ${user.id}` : 'No user')
    }

    return { supabaseResponse, user }
}
