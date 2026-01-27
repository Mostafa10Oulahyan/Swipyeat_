import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Create a single response that will be modified
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: This refreshes the auth token
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'
  const isDashboard = pathname.startsWith('/dashboard')
  const isRoot = pathname === '/'

  // Helper to create redirect with preserved cookies
  const redirectWithCookies = (url: string) => {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url))
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Redirect root to login
  if (isRoot) {
    return redirectWithCookies('/login')
  }

  // Unauthenticated user trying to access dashboard -> Login
  if (!user && isDashboard) {
    return redirectWithCookies('/login')
  }

  // Authenticated user on login page -> Dashboard
  if (user && isLoginPage) {
    return redirectWithCookies('/dashboard')
  }

  // Role-Based Access Control
  if (user) {
    const role = user.user_metadata?.role
    const restrictedRoutes = ['/settings', '/staff']
    const isRestrictedRoute = restrictedRoutes.some(route => pathname.includes(route))

    if (role === 'manager' && isRestrictedRoute) {
      return redirectWithCookies('/dashboard')
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}