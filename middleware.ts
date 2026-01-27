import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // Redirect logged-in users away from auth pages
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect root to login or dashboard
  if (pathname === '/') {
    const target = user ? '/dashboard' : '/login'
    const url = request.nextUrl.clone()
    url.pathname = target
    return NextResponse.redirect(url)
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-Based Access Control for authenticated users
  // The role is stored in the 'users' table, not in user_metadata
  if (user && pathname.startsWith('/dashboard')) {
    const restrictedRoutes = ['/settings', '/staff', '/subscription']
    const isRestrictedRoute = restrictedRoutes.some(route => pathname.includes(route))

    if (isRestrictedRoute) {
      // Create a supabase client to query the database for the user's role
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // We don't need to set cookies here, just reading
            },
          },
        }
      )

      // Fetch the user's role from the users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error && userProfile?.role === 'manager') {
        console.log(`[MIDDLEWARE] Manager blocked from accessing: ${pathname}`)
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}