import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createHash, randomBytes } from 'crypto'
import { securityLogger } from '@/lib/security-logger'

export interface CSRFTokenData {
  token: string
  expiresAt: number
  userId: string
  sessionId: string
}

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map<string, CSRFTokenData>()

// Token expiration time (30 minutes)
const CSRF_TOKEN_EXPIRY = 30 * 60 * 1000

class CSRFProtection {
  // Generate a CSRF token for a user session
  generateToken(userId: string, sessionId?: string): string {
    const randomData = randomBytes(32).toString('hex')
    const timestamp = Date.now().toString()
    const sessionIdentifier = sessionId || userId

    // Debug: console.log('🔧 [CSRF] Generating token:', { userId, sessionId, sessionIdentifier, timestamp })

    // Create token using hash of random data + user info + timestamp
    const tokenData = `${randomData}-${userId}-${sessionIdentifier}-${timestamp}`
    const token = createHash('sha256').update(tokenData).digest('hex')

    // Store token with expiration
    const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY
    const tokenInfo = {
      token,
      expiresAt,
      userId,
      sessionId: sessionIdentifier
    }

    csrfTokens.set(token, tokenInfo)

    console.log('✅ [CSRF] Token generated:', { tokenPrefix: token.substring(0, 8), userId, totalTokens: csrfTokens.size })

    // Clean up expired tokens periodically
    this.cleanupExpiredTokens()

    return token
  }

  // Validate a CSRF token
  validateToken(token: string, userId: string, sessionId?: string): boolean {
    if (!token || !userId) {
      console.log('❌ [CSRF] Missing token or userId')
      return false
    }

    const tokenData = csrfTokens.get(token)
    if (!tokenData) {
      console.log('❌ [CSRF] Token not found in storage. Available tokens:', csrfTokens.size)
      return false
    }

    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      console.log('❌ [CSRF] Token expired')
      csrfTokens.delete(token)
      return false
    }

    // Check if token belongs to the correct user
    if (tokenData.userId !== userId) {
      console.log('❌ [CSRF] User ID mismatch:', { expected: userId, found: tokenData.userId })
      return false
    }

    // Check session ID if provided
    if (sessionId && tokenData.sessionId !== sessionId) {
      console.log('❌ [CSRF] Session ID mismatch:', { expected: sessionId, found: tokenData.sessionId })
      return false
    }

    console.log('✅ [CSRF] Token validation successful for user:', userId)
    return true
  }

  // Consume (delete) a token after successful validation
  consumeToken(token: string): boolean {
    if (csrfTokens.has(token)) {
      csrfTokens.delete(token)
      return true
    }
    return false
  }

  // Clean up expired tokens
  private cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [token, data] of csrfTokens.entries()) {
      if (now > data.expiresAt) {
        csrfTokens.delete(token)
      }
    }
  }

  // Get CSRF token statistics
  getTokenStats(): {
    totalTokens: number
    expiredTokens: number
    activeTokens: number
    oldestToken?: number
  } {
    const now = Date.now()
    let expiredCount = 0
    let activeCount = 0
    let oldestToken: number | undefined

    for (const [_, data] of csrfTokens.entries()) {
      if (now > data.expiresAt) {
        expiredCount++
      } else {
        activeCount++
        const tokenAge = now - (data.expiresAt - CSRF_TOKEN_EXPIRY)
        if (!oldestToken || tokenAge > (now - oldestToken)) {
          oldestToken = data.expiresAt - CSRF_TOKEN_EXPIRY
        }
      }
    }

    return {
      totalTokens: csrfTokens.size,
      expiredTokens: expiredCount,
      activeTokens: activeCount,
      oldestToken
    }
  }
}

// Export singleton instance
export const csrfProtection = new CSRFProtection()

// Middleware function to protect endpoints
export async function validateCSRFToken(
  req: NextRequest,
  authOptions: any,
  options: {
    consumeToken?: boolean
    strictSessionCheck?: boolean
  } = {}
): Promise<{ isValid: boolean; response?: NextResponse; userId?: string }> {
  try {
    const session = await getServerSession(authOptions) as any

    if (!session?.user?.id) {
      await securityLogger.log({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: req.nextUrl?.pathname,
        method: req.method,
        description: 'CSRF validation attempted without valid session'
      })

      return {
        isValid: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const userId = session.user.id

    // Get CSRF token from headers
    const csrfToken = req.headers.get('x-csrf-token') ||
                     req.headers.get('csrf-token') ||
                     req.headers.get('x-xsrf-token')

    if (!csrfToken) {
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: req.nextUrl?.pathname,
        method: req.method,
        description: 'Request missing CSRF token - potential CSRF attack',
        metadata: {
          hasSessionCookie: !!req.cookies.get('next-auth.session-token'),
          userAgent: req.headers.get('user-agent'),
          referer: req.headers.get('referer'),
          origin: req.headers.get('origin')
        }
      })

      return {
        isValid: false,
        response: NextResponse.json(
          { error: 'CSRF token required' },
          { status: 403 }
        )
      }
    }

    // Validate the token
    const sessionId = options.strictSessionCheck ? session.sessionId : undefined
    const isValidToken = csrfProtection.validateToken(csrfToken, userId, sessionId)

    if (!isValidToken) {
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'CRITICAL',
        userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: req.nextUrl?.pathname,
        method: req.method,
        description: 'Invalid CSRF token - potential CSRF attack detected',
        metadata: {
          providedToken: csrfToken.substring(0, 8) + '...',
          tokenLength: csrfToken.length,
          referer: req.headers.get('referer'),
          origin: req.headers.get('origin'),
          hasValidSession: !!session
        }
      })

      return {
        isValid: false,
        response: NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }

    // Consume token if requested (one-time use)
    if (options.consumeToken) {
      csrfProtection.consumeToken(csrfToken)
    }

    return {
      isValid: true,
      userId
    }

  } catch (error) {
    await securityLogger.log({
      type: 'API_ERROR',
      severity: 'HIGH',
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      endpoint: req.nextUrl?.pathname,
      method: req.method,
      description: `CSRF validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    })

    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 500 }
      )
    }
  }
}

// API endpoint to generate CSRF tokens
export async function generateCSRFTokenResponse(
  req: NextRequest,
  authOptions: any
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions) as any

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = csrfProtection.generateToken(session.user.id, session.sessionId)

    await securityLogger.log({
      type: 'LOGIN_SUCCESS',
      severity: 'LOW',
      userId: session.user.id,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      endpoint: req.nextUrl?.pathname,
      description: 'CSRF token generated',
      metadata: {
        tokenLength: token.length
      }
    })

    return NextResponse.json({
      csrfToken: token,
      expiresIn: CSRF_TOKEN_EXPIRY
    }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    await securityLogger.log({
      type: 'API_ERROR',
      severity: 'MEDIUM',
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      endpoint: req.nextUrl?.pathname,
      description: `CSRF token generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })

    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

// Cleanup expired tokens periodically (every 5 minutes)
setInterval(() => {
  try {
    const beforeCount = csrfTokens.size
    csrfProtection['cleanupExpiredTokens']()
    const afterCount = csrfTokens.size
    const cleaned = beforeCount - afterCount

    if (cleaned > 0) {
      console.log(`🧹 CSRF: Cleaned up ${cleaned} expired tokens (${afterCount} remain)`)
    }
  } catch (error) {
    console.error('CSRF token cleanup error:', error)
  }
}, 5 * 60 * 1000)