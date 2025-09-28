import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { securityLogger } from '@/lib/security-logger'

export interface SessionValidationOptions {
  maxSessionAge?: number // in milliseconds
  requireRecentActivity?: boolean
  recentActivityThreshold?: number // in milliseconds
  checkIpConsistency?: boolean
  checkUserAgentConsistency?: boolean
}

export interface SessionValidationResult {
  isValid: boolean
  reason?: string
  shouldTerminate?: boolean
  warningLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

class SessionValidator {
  private sessionCache = new Map<string, {
    lastActivity: number
    ip: string
    userAgent: string
    loginTime: number
  }>()

  // Default options
  private defaultOptions: SessionValidationOptions = {
    maxSessionAge: 24 * 60 * 60 * 1000, // 24 hours
    requireRecentActivity: true,
    recentActivityThreshold: 2 * 60 * 60 * 1000, // 2 hours of inactivity
    checkIpConsistency: true,
    checkUserAgentConsistency: true
  }

  async validateSession(
    req: NextRequest,
    authOptions: any,
    options: SessionValidationOptions = {}
  ): Promise<SessionValidationResult> {
    try {
      const opts = { ...this.defaultOptions, ...options }
      const session = await getServerSession(authOptions) as any

      if (!session?.user?.id) {
        return {
          isValid: false,
          reason: 'No valid session found'
        }
      }

      const userId = session.user.id
      const currentIp = req.headers.get('x-forwarded-for') ||
                       req.headers.get('x-real-ip') ||
                       req.headers.get('cf-connecting-ip') ||
                       'unknown'
      const currentUserAgent = req.headers.get('user-agent') || 'unknown'
      const now = Date.now()

      // Get or create session tracking data
      let sessionData = this.sessionCache.get(userId)

      if (!sessionData) {
        // First time seeing this session, initialize tracking
        sessionData = {
          lastActivity: now,
          ip: currentIp,
          userAgent: currentUserAgent,
          loginTime: now
        }
        this.sessionCache.set(userId, sessionData)

        await securityLogger.log({
          type: 'LOGIN_SUCCESS',
          severity: 'LOW',
          userId,
          ipAddress: currentIp,
          userAgent: currentUserAgent,
          endpoint: req.nextUrl?.pathname,
          description: 'Session tracking initialized',
          metadata: {
            sessionStart: new Date(now).toISOString()
          }
        })

        return { isValid: true }
      }

      // Check session age
      if (opts.maxSessionAge && (now - sessionData.loginTime) > opts.maxSessionAge) {
        await securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          userId,
          ipAddress: currentIp,
          userAgent: currentUserAgent,
          endpoint: req.nextUrl?.pathname,
          description: 'Session expired due to maximum age',
          metadata: {
            sessionAge: now - sessionData.loginTime,
            maxAllowed: opts.maxSessionAge
          }
        })

        this.sessionCache.delete(userId)
        return {
          isValid: false,
          reason: 'Session expired due to age',
          shouldTerminate: true,
          warningLevel: 'MEDIUM'
        }
      }

      // Check recent activity
      if (opts.requireRecentActivity && opts.recentActivityThreshold) {
        const timeSinceActivity = now - sessionData.lastActivity
        if (timeSinceActivity > opts.recentActivityThreshold) {
          await securityLogger.log({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'MEDIUM',
            userId,
            ipAddress: currentIp,
            userAgent: currentUserAgent,
            endpoint: req.nextUrl?.pathname,
            description: 'Session expired due to inactivity',
            metadata: {
              inactivityDuration: timeSinceActivity,
              threshold: opts.recentActivityThreshold
            }
          })

          this.sessionCache.delete(userId)
          return {
            isValid: false,
            reason: 'Session expired due to inactivity',
            shouldTerminate: true,
            warningLevel: 'MEDIUM'
          }
        }
      }

      // Check IP consistency
      if (opts.checkIpConsistency && sessionData.ip !== currentIp) {
        await securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          userId,
          ipAddress: currentIp,
          userAgent: currentUserAgent,
          endpoint: req.nextUrl?.pathname,
          description: 'IP address changed during session',
          metadata: {
            originalIp: sessionData.ip,
            newIp: currentIp,
            sessionAge: now - sessionData.loginTime
          }
        })

        // Don't immediately terminate, but flag as suspicious
        // Could be legitimate (mobile networks, VPNs, etc.)
        sessionData.ip = currentIp // Update to new IP
        return {
          isValid: true,
          reason: 'IP address changed - flagged as suspicious',
          warningLevel: 'HIGH'
        }
      }

      // Check User Agent consistency
      if (opts.checkUserAgentConsistency && sessionData.userAgent !== currentUserAgent) {
        await securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          userId,
          ipAddress: currentIp,
          userAgent: currentUserAgent,
          endpoint: req.nextUrl?.pathname,
          description: 'User Agent changed during session',
          metadata: {
            originalUserAgent: sessionData.userAgent,
            newUserAgent: currentUserAgent,
            sessionAge: now - sessionData.loginTime
          }
        })

        // This is more suspicious than IP change
        return {
          isValid: false,
          reason: 'User Agent changed during session - potential session hijacking',
          shouldTerminate: true,
          warningLevel: 'CRITICAL'
        }
      }

      // Update last activity
      sessionData.lastActivity = now
      this.sessionCache.set(userId, sessionData)

      return { isValid: true }

    } catch (error) {
      await securityLogger.log({
        type: 'API_ERROR',
        severity: 'HIGH',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: req.nextUrl?.pathname,
        description: `Session validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      })

      return {
        isValid: false,
        reason: 'Session validation failed',
        warningLevel: 'HIGH'
      }
    }
  }

  // Manual session termination
  terminateSession(userId: string): void {
    this.sessionCache.delete(userId)
  }

  // Get session info
  getSessionInfo(userId: string) {
    return this.sessionCache.get(userId)
  }

  // Cleanup expired sessions
  cleanupExpiredSessions(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now()
    let cleaned = 0

    for (const [userId, sessionData] of this.sessionCache.entries()) {
      if ((now - sessionData.loginTime) > maxAge) {
        this.sessionCache.delete(userId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired session(s)`)
    }

    return cleaned
  }

  // Get session statistics
  getSessionStats() {
    const now = Date.now()
    const sessions = Array.from(this.sessionCache.values())

    return {
      totalActiveSessions: sessions.length,
      averageSessionAge: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (now - s.loginTime), 0) / sessions.length
        : 0,
      oldestSession: sessions.length > 0
        ? Math.min(...sessions.map(s => s.loginTime))
        : null,
      uniqueIPs: new Set(sessions.map(s => s.ip)).size,
      generatedAt: new Date().toISOString()
    }
  }
}

// Export singleton instance
export const sessionValidator = new SessionValidator()

// Cleanup expired sessions every hour
setInterval(() => {
  sessionValidator.cleanupExpiredSessions()
}, 60 * 60 * 1000)

// Enhanced session validation middleware for payment endpoints
export async function validatePaymentSession(
  req: NextRequest,
  authOptions: any
): Promise<{ isValid: boolean; response?: NextResponse }> {
  const validation = await sessionValidator.validateSession(req, authOptions, {
    maxSessionAge: 12 * 60 * 60 * 1000, // 12 hours for payment operations
    requireRecentActivity: true,
    recentActivityThreshold: 30 * 60 * 1000, // 30 minutes for payments
    checkIpConsistency: true,
    checkUserAgentConsistency: true
  })

  if (!validation.isValid) {
    const response = NextResponse.json(
      {
        error: 'Session validation failed',
        reason: validation.reason,
        shouldReauth: validation.shouldTerminate
      },
      {
        status: 401,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    )

    return { isValid: false, response }
  }

  // Log warning if suspicious but still valid
  if (validation.warningLevel && validation.warningLevel !== 'LOW') {
    console.warn(`⚠️ Session validation warning: ${validation.reason}`)
  }

  return { isValid: true }
}