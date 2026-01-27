import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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
  if (user) {
    const role = user.user_metadata?.role
    const restrictedRoutes = ['/settings', '/staff']
    const isRestrictedRoute = restrictedRoutes.some(route => pathname.includes(route))

    if (role === 'manager' && isRestrictedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}