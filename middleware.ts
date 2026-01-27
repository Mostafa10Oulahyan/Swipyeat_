import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1. Update session (refresh token)
  const response = await updateSession(request);

  // 2. Check Auth status
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // processed in updateSession
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/login";
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isRoot = request.nextUrl.pathname === "/";

  // Redirect root to login
  if (isRoot) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If unauthenticated and trying to access dashboard -> Redirect to Login
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated and trying to access login -> Redirect to Dashboard (or specific restaurant)
  if (user && isLoginPage) {
    // Ideally fetch restaurant slug here, or just go to /dashboard and let page handle it
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-Based Access Control (RBAC)
  if (user) {
    const role = user.user_metadata?.role;
    // "restaurant_admin" has full access.
    // "manager" is restricted from Settings and Staff as per request.

    const restrictedRoutes = ['/settings', '/staff'];
    const isRestrictedRoute = restrictedRoutes.some(route => request.nextUrl.pathname.includes(route));

    if (role === 'manager' && isRestrictedRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}