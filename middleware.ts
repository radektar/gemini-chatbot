// PoC: Bypass authentication - all requests pass through
// For production, restore NextAuth middleware

export default function middleware() {
  // Pass through all requests without authentication check
  return;
}

export const config = {
  matcher: [], // Don't match any routes - bypass all middleware
};
