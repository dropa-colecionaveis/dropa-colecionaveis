import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRateLimiterStats } from '@/lib/rate-limiter'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to view rate limit stats
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
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