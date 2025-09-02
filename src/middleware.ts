import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow access to home page
        if (req.nextUrl.pathname === '/') {
          return true
        }

        // Allow access to public profile pages (but not settings)
        if (req.nextUrl.pathname.startsWith('/profile/') && 
            !req.nextUrl.pathname.startsWith('/profile/settings')) {
          return true
        }

        // Allow access to API routes that don't require auth
        if (req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true
        }

        // Allow access to public stats API
        if (req.nextUrl.pathname.startsWith('/api/stats/public') || 
            req.nextUrl.pathname.startsWith('/api/stats/live')) {
          return true
        }

        // Allow access to public profile API
        if (req.nextUrl.pathname.startsWith('/api/profile/') || req.nextUrl.pathname.startsWith('/api/profile-simple/')) {
          return true
        }

        // Require authentication for dashboard, admin, and other protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard') ||
            req.nextUrl.pathname.startsWith('/admin') ||
            req.nextUrl.pathname.startsWith('/credits') ||
            req.nextUrl.pathname.startsWith('/packs') ||
            req.nextUrl.pathname.startsWith('/inventory') ||
            req.nextUrl.pathname.startsWith('/achievements') ||
            req.nextUrl.pathname.startsWith('/rankings')) {
          return !!token
        }

        // Require authentication for API routes
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}