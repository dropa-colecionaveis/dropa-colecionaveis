import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { getRateLimiterStats } = await import('@/lib/rate-limiter')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    const stats = getRateLimiterStats()
    
    // Get system info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    }

    return NextResponse.json({
      success: true,
      rateLimiter: stats,
      system: systemInfo,
      limits: {
        auth: { max: 5, windowMinutes: 15 },
        payment: { max: 10, windowMinutes: 60 },
        api: { max: 100, windowMinutes: 15 },
        strict: { max: 3, windowMinutes: 5 },
        web: { max: 1000, windowMinutes: 15 }
      }
    })

  } catch (error) {
    console.error('Error fetching rate limit stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}