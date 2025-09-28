import { NextRequest, NextResponse } from 'next/server'
import { securityLogger } from '@/lib/security-logger'

export interface SecurityConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  maxRequestSize: number
  strictCORS: boolean
  blockSuspiciousIPs: boolean
  requireHTTPS: boolean
}

const DEFAULT_CONFIG: SecurityConfig = {
  allowedOrigins: [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'https://colecionaveis.com',
    'https://www.colecionaveis.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  strictCORS: true,
  blockSuspiciousIPs: true,
  requireHTTPS: process.env.NODE_ENV === 'production'
}

// Suspicious IP tracking
const suspiciousIPs = new Map<string, {
  requests: number
  lastRequest: number
  blocked: boolean
  reason: string
}>()

// Rate limiting per IP
const ipRateLimit = new Map<string, {
  requests: number
  windowStart: number
}>()

const IP_RATE_LIMIT = 100 // requests per window
const IP_RATE_WINDOW = 60 * 1000 // 1 minute

class SecurityMiddleware {
  private config: SecurityConfig

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // Main security check
  async checkSecurity(req: NextRequest): Promise<{
    allowed: boolean
    response?: NextResponse
    issues: string[]
  }> {
    const issues: string[] = []
    const clientIP = this.getClientIP(req)
    const origin = req.headers.get('origin')
    const userAgent = req.headers.get('user-agent') || ''

    // 1. HTTPS enforcement
    if (this.config.requireHTTPS && req.nextUrl.protocol !== 'https:') {
      issues.push('HTTPS required')

      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        ipAddress: clientIP,
        userAgent,
        endpoint: req.nextUrl.pathname,
        description: 'Non-HTTPS request blocked',
        metadata: {
          protocol: req.nextUrl.protocol,
          host: req.nextUrl.host
        }
      })

      return {
        allowed: false,
        response: NextResponse.redirect(
          req.nextUrl.href.replace('http:', 'https:')
        ),
        issues
      }
    }

    // 2. IP-based rate limiting
    const ipRateCheck = this.checkIPRateLimit(clientIP)
    if (!ipRateCheck.allowed) {
      issues.push('IP rate limit exceeded')

      await securityLogger.log({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'HIGH',
        ipAddress: clientIP,
        userAgent,
        endpoint: req.nextUrl.pathname,
        description: `IP rate limit exceeded: ${ipRateCheck.requests} requests`,
        metadata: {
          requestCount: ipRateCheck.requests,
          windowStart: ipRateCheck.windowStart
        }
      })

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Limit': IP_RATE_LIMIT.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil((ipRateCheck.windowStart + IP_RATE_WINDOW) / 1000).toString()
            }
          }
        ),
        issues
      }
    }

    // 3. Suspicious IP blocking
    if (this.config.blockSuspiciousIPs && this.isIPBlocked(clientIP)) {
      issues.push('IP blocked as suspicious')

      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'CRITICAL',
        ipAddress: clientIP,
        userAgent,
        endpoint: req.nextUrl.pathname,
        description: 'Blocked suspicious IP attempted access',
        metadata: {
          blockReason: suspiciousIPs.get(clientIP)?.reason
        }
      })

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        ),
        issues
      }
    }

    // 4. CORS validation for API requests
    if (req.nextUrl.pathname.startsWith('/api/') && this.config.strictCORS) {
      const corsCheck = this.validateCORS(req, origin)
      if (!corsCheck.allowed) {
        issues.push('CORS violation')

        await securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          ipAddress: clientIP,
          userAgent,
          endpoint: req.nextUrl.pathname,
          description: `CORS violation: ${corsCheck.reason}`,
          metadata: {
            origin,
            referer: req.headers.get('referer'),
            allowedOrigins: this.config.allowedOrigins
          }
        })

        return {
          allowed: false,
          response: NextResponse.json(
            { error: 'CORS violation' },
            {
              status: 403,
              headers: this.getCORSHeaders(origin)
            }
          ),
          issues
        }
      }
    }

    // 5. Request size validation
    const contentLength = parseInt(req.headers.get('content-length') || '0')
    if (contentLength > this.config.maxRequestSize) {
      issues.push('Request too large')

      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        ipAddress: clientIP,
        userAgent,
        endpoint: req.nextUrl.pathname,
        description: `Request size exceeds limit: ${contentLength} bytes`,
        metadata: {
          contentLength,
          maxAllowed: this.config.maxRequestSize
        }
      })

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Request too large' },
          { status: 413 }
        ),
        issues
      }
    }

    // 6. Suspicious User Agent detection
    if (this.isSuspiciousUserAgent(userAgent)) {
      issues.push('Suspicious User Agent')
      this.markIPAsSuspicious(clientIP, 'Suspicious User Agent detected')

      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        ipAddress: clientIP,
        userAgent,
        endpoint: req.nextUrl.pathname,
        description: 'Suspicious User Agent detected',
        metadata: {
          userAgent,
          suspiciousPatterns: this.getSuspiciousUAPatterns().filter(pattern =>
            pattern.test(userAgent)
          ).map(p => p.source)
        }
      })
    }

    return {
      allowed: true,
      issues
    }
  }

  // Get client IP address
  private getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0] ||
           req.headers.get('x-real-ip') ||
           req.headers.get('cf-connecting-ip') ||
           'unknown'
  }

  // Check IP rate limit
  private checkIPRateLimit(ip: string): {
    allowed: boolean
    requests: number
    windowStart: number
  } {
    const now = Date.now()
    let rateLimitData = ipRateLimit.get(ip)

    if (!rateLimitData || (now - rateLimitData.windowStart) > IP_RATE_WINDOW) {
      // New window
      rateLimitData = {
        requests: 1,
        windowStart: now
      }
      ipRateLimit.set(ip, rateLimitData)
      return { allowed: true, ...rateLimitData }
    }

    rateLimitData.requests++

    return {
      allowed: rateLimitData.requests <= IP_RATE_LIMIT,
      ...rateLimitData
    }
  }

  // Check if IP is blocked
  private isIPBlocked(ip: string): boolean {
    const suspiciousData = suspiciousIPs.get(ip)
    return suspiciousData?.blocked || false
  }

  // Mark IP as suspicious
  private markIPAsSuspicious(ip: string, reason: string): void {
    const existing = suspiciousIPs.get(ip) || {
      requests: 0,
      lastRequest: 0,
      blocked: false,
      reason: ''
    }

    existing.requests++
    existing.lastRequest = Date.now()
    existing.reason = reason

    // Block after 3 suspicious activities
    if (existing.requests >= 3) {
      existing.blocked = true
    }

    suspiciousIPs.set(ip, existing)
  }

  // Validate CORS
  private validateCORS(req: NextRequest, origin: string | null): {
    allowed: boolean
    reason?: string
  } {
    // Allow same-origin requests
    if (!origin || origin === req.nextUrl.origin) {
      return { allowed: true }
    }

    // Check webhook endpoints (Mercado Pago, etc.)
    if (req.nextUrl.pathname.includes('/webhook')) {
      // Allow external webhooks but log them
      return { allowed: true }
    }

    // Check if origin is in allowed list
    if (this.config.allowedOrigins.includes(origin)) {
      return { allowed: true }
    }

    // Check for localhost in development
    if (process.env.NODE_ENV === 'development' &&
        (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: `Origin '${origin}' not in allowed list`
    }
  }

  // Get CORS headers
  private getCORSHeaders(origin: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Access-Control-Allow-Methods': this.config.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Vary': 'Origin'
    }

    if (origin && this.config.allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin
      headers['Access-Control-Allow-Credentials'] = 'true'
    }

    return headers
  }

  // Detect suspicious User Agents
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = this.getSuspiciousUAPatterns()
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  // Get suspicious User Agent patterns
  private getSuspiciousUAPatterns(): RegExp[] {
    return [
      /bot|crawler|spider|scraper/i,
      /curl|wget|python|java|go-http|postman/i,
      /sqlmap|nikto|nmap|masscan|zap/i,
      /^$/,  // Empty user agent
      /.{200,}/, // Extremely long user agent
      /\<script|\<iframe|\<object/i, // HTML injection attempts
      /union.*select|drop.*table|insert.*into/i // SQL injection attempts
    ]
  }

  // Get security statistics
  getSecurityStats(): {
    suspiciousIPs: number
    blockedIPs: number
    rateLimitedIPs: number
    totalIPsTracked: number
  } {
    let suspiciousCount = 0
    let blockedCount = 0

    for (const [_, data] of suspiciousIPs.entries()) {
      if (data.blocked) blockedCount++
      if (data.requests > 0) suspiciousCount++
    }

    return {
      suspiciousIPs: suspiciousCount,
      blockedIPs: blockedCount,
      rateLimitedIPs: ipRateLimit.size,
      totalIPsTracked: suspiciousIPs.size
    }
  }

  // Unblock IP (for admin use)
  unblockIP(ip: string): boolean {
    const data = suspiciousIPs.get(ip)
    if (data) {
      data.blocked = false
      data.requests = 0
      suspiciousIPs.set(ip, data)
      return true
    }
    return false
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware()

// Apply security middleware to requests
export async function applySecurityMiddleware(
  req: NextRequest,
  config?: Partial<SecurityConfig>
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const middleware = config ? new SecurityMiddleware(config) : securityMiddleware
  const result = await middleware.checkSecurity(req)

  return {
    allowed: result.allowed,
    response: result.response
  }
}

// Cleanup old data periodically
setInterval(() => {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000

  // Cleanup rate limit data
  for (const [ip, data] of ipRateLimit.entries()) {
    if ((now - data.windowStart) > IP_RATE_WINDOW) {
      ipRateLimit.delete(ip)
    }
  }

  // Cleanup old suspicious IP data (but keep blocked ones)
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (!data.blocked && (now - data.lastRequest) > fiveMinutesAgo) {
      suspiciousIPs.delete(ip)
    }
  }
}, 5 * 60 * 1000) // Run every 5 minutes