import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { securityLogger } from '@/lib/security-logger'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip rate limiting for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Apply different rate limits based on route patterns
  let rateLimitResponse: NextResponse | null = null

  // Authentication routes - strictest limits
  if (pathname.startsWith('/api/auth') || pathname.includes('signin') || pathname.includes('signup')) {
    rateLimitResponse = applyRateLimit(request, RATE_LIMITS.AUTH)
  }
  
  // Payment routes - moderate limits
  else if (pathname.startsWith('/api/payments')) {
    rateLimitResponse = applyRateLimit(request, RATE_LIMITS.PAYMENT)
  }
  
  // Data request routes (LGPD) - strict limits
  else if (pathname.startsWith('/api/user/data-requests')) {
    rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STRICT)
  }
  
  // General API routes
  else if (pathname.startsWith('/api/')) {
    rateLimitResponse = applyRateLimit(request, RATE_LIMITS.API)
  }
  
  // Web pages - more lenient
  else {
    rateLimitResponse = applyRateLimit(request, RATE_LIMITS.WEB)
  }

  // If rate limit exceeded, return error response
  if (rateLimitResponse) {
    // Log security event
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip
    const userAgent = request.headers.get('user-agent')
    
    console.warn(`🚨 Rate limit exceeded: ${ip} -> ${pathname}`)
    
    // Log rate limit violation
    securityLogger.logRateLimit(
      ip || 'unknown',
      pathname,
      userAgent || undefined
    ).catch(err => console.error('Failed to log rate limit event:', err))
    
    return rateLimitResponse
  }

  // Add security headers to response
  const response = NextResponse.next()
  
  // Add additional security headers not covered by next.config.js
  response.headers.set('X-Request-ID', crypto.randomUUID())
  response.headers.set('X-Timestamp', new Date().toISOString())
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}