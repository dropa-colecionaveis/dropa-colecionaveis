import { NextRequest, NextResponse } from 'next/server'

// In-memory store for rate limiting (for production, use Redis)
interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now && (!entry.blockUntil || entry.blockUntil < now)) {
        this.store.delete(key)
      }
    }
  }

  private getIdentifier(req: NextRequest): string {
    // Try to get real IP from headers (for production behind proxy)
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || req.ip || 'unknown'
    
    // For authenticated requests, also consider user ID
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    return `${ip}:${userAgent.slice(0, 50)}`
  }

  check(req: NextRequest, options: RateLimitOptions): RateLimitResult {
    const identifier = this.getIdentifier(req)
    const now = Date.now()
    
    let entry = this.store.get(identifier)
    
    // Check if currently blocked
    if (entry?.blocked && entry.blockUntil && entry.blockUntil > now) {
      return {
        success: false,
        limit: options.max,
        remaining: 0,
        reset: entry.blockUntil,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
        blocked: true
      }
    }

    // Initialize or reset if window expired
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + options.windowMs,
        blocked: false
      }
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > options.max) {
      // Block for progressive duration
      const blockDuration = this.calculateBlockDuration(entry.count, options.max)
      entry.blocked = true
      entry.blockUntil = now + blockDuration

      this.store.set(identifier, entry)

      // Log security event
      console.warn(`🚨 Rate limit exceeded: ${identifier} (${entry.count}/${options.max})`)

      return {
        success: false,
        limit: options.max,
        remaining: 0,
        reset: entry.blockUntil,
        retryAfter: Math.ceil(blockDuration / 1000),
        blocked: true
      }
    }

    this.store.set(identifier, entry)

    return {
      success: true,
      limit: options.max,
      remaining: options.max - entry.count,
      reset: entry.resetTime,
      retryAfter: 0,
      blocked: false
    }
  }

  private calculateBlockDuration(attempts: number, limit: number): number {
    // Progressive blocking: more attempts = longer block time
    const baseBlock = 60 * 1000 // 1 minute
    const multiplier = Math.min(attempts - limit, 10) // Max 10x multiplier
    return baseBlock * Math.pow(2, multiplier) // Exponential backoff
  }

  // Get stats for monitoring
  getStats() {
    const now = Date.now()
    const activeEntries = Array.from(this.store.values()).filter(
      entry => entry.resetTime > now || (entry.blockUntil && entry.blockUntil > now)
    )
    
    const blockedEntries = activeEntries.filter(entry => entry.blocked)
    
    return {
      totalActive: activeEntries.length,
      totalBlocked: blockedEntries.length,
      memoryUsage: this.store.size
    }
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter()

export interface RateLimitOptions {
  max: number       // Maximum requests
  windowMs: number  // Time window in milliseconds
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter: number
  blocked: boolean
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH: {
    max: 5,           // 5 attempts
    windowMs: 15 * 60 * 1000  // per 15 minutes
  },
  
  // Payment endpoints
  PAYMENT: {
    max: 10,          // 10 payment attempts
    windowMs: 60 * 60 * 1000  // per hour
  },
  
  // API endpoints (general)
  API: {
    max: 100,         // 100 requests
    windowMs: 15 * 60 * 1000  // per 15 minutes
  },
  
  // Strict rate limit for sensitive operations
  STRICT: {
    max: 3,           // 3 attempts
    windowMs: 5 * 60 * 1000   // per 5 minutes
  },
  
  // General web requests
  WEB: {
    max: 1000,        // 1000 requests
    windowMs: 15 * 60 * 1000  // per 15 minutes
  }
}

export function rateLimit(options: RateLimitOptions) {
  return (req: NextRequest): RateLimitResult => {
    return rateLimiter.check(req, options)
  }
}

export function createRateLimitResponse(result: RateLimitResult, message?: string): NextResponse {
  const response = NextResponse.json(
    {
      error: message || 'Too many requests',
      retryAfter: result.retryAfter,
      limit: result.limit,
      remaining: result.remaining
    },
    { status: 429 }
  )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())
  response.headers.set('Retry-After', result.retryAfter.toString())

  return response
}

// Middleware helper for applying rate limits
export function applyRateLimit(req: NextRequest, options: RateLimitOptions): NextResponse | null {
  const result = rateLimit(options)(req)
  
  if (!result.success) {
    const message = result.blocked 
      ? 'Too many requests. You have been temporarily blocked.'
      : 'Rate limit exceeded. Please try again later.'
      
    return createRateLimitResponse(result, message)
  }
  
  return null
}

// Get rate limiter stats (for admin dashboard)
export function getRateLimiterStats() {
  return rateLimiter.getStats()
}

export { rateLimiter }