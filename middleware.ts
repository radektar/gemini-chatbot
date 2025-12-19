import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/(auth)/auth.config";

// Create NextAuth instance with full config (including providers) for middleware
// This ensures middleware can properly check authentication even if providers are configured
const { auth } = NextAuth({
  ...authConfig,
  providers: [
    // Only include Google provider if credentials are available
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
});

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] ${pathname} - isLoggedIn: ${isLoggedIn}, auth:`, req.auth ? "exists" : "null");
  }

  // DEV bypass: allow all requests if AUTH_BYPASS=true and in development
  const authBypass =
    process.env.AUTH_BYPASS === "true" &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV !== "production");

  if (authBypass) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] AUTH_BYPASS enabled - allowing ${pathname}`);
    }
    return; // Pass through all requests
  }

  // Allow access to login and register pages
  if (pathname === "/login" || pathname === "/register") {
    // If logged in and trying to access login/register, redirect to home
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Allow access to login/register pages
    return;
  }

  // Allow NextAuth callback routes (they handle authentication themselves)
  if (pathname.startsWith("/api/auth/")) {
    return; // Let NextAuth handle its own routes
  }

  // API routes: return 401 for unauthenticated requests
  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Middleware] API route ${pathname} - returning 401`);
      }
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return; // Allow authenticated API requests
  }

  // UI routes: redirect to login if not authenticated
  if (!isLoggedIn) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] UI route ${pathname} - redirecting to /login`);
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Allow authenticated users to access UI routes
  return;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
