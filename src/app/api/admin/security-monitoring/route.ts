import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { securityLogger } = await import('@/lib/security-logger')
    const { securityMiddleware } = await import('@/lib/security-middleware')
    const { csrfProtection } = await import('@/lib/csrf-protection')

    const session = await getServerSession(authOptions) as any

    // Check if user is admin
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const hours = parseInt(req.nextUrl.searchParams.get('hours') || '24')
    const maxHours = 168 // 1 week maximum

    if (hours > maxHours) {
      return NextResponse.json(
        { error: `Maximum ${maxHours} hours allowed` },
        { status: 400 }
      )
    }

    // Get security statistics
    const [securityStats, middlewareStats, csrfStats] = await Promise.all([
      securityLogger.getSecurityStats(hours),
      Promise.resolve(securityMiddleware.getSecurityStats()),
      Promise.resolve(csrfProtection.getTokenStats())
    ])

    // Get recent security logs
    const recentLogs = await securityLogger.searchLogs({
      severity: 'HIGH',
      startDate: new Date(Date.now() - hours * 60 * 60 * 1000)
    }, 50)

    // Analyze trends
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    const recentHighSeverity = recentLogs.filter(log =>
      new Date(log.createdAt).getTime() > oneHourAgo
    ).length

    const dailyHighSeverity = recentLogs.filter(log =>
      new Date(log.createdAt).getTime() > oneDayAgo
    ).length

    // Calculate threat level
    let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
    const alertConditions: string[] = []

    if (recentHighSeverity > 10) {
      threatLevel = 'HIGH'
      alertConditions.push(`${recentHighSeverity} high-severity events in last hour`)
    } else if (recentHighSeverity > 5) {
      threatLevel = 'MEDIUM'
      alertConditions.push(`${recentHighSeverity} high-severity events in last hour`)
    }

    if (middlewareStats.blockedIPs > 5) {
      if (threatLevel === 'LOW') threatLevel = 'MEDIUM'
      alertConditions.push(`${middlewareStats.blockedIPs} IPs currently blocked`)
    }

    if (dailyHighSeverity > 50) {
      threatLevel = 'CRITICAL'
      alertConditions.push(`${dailyHighSeverity} high-severity events in last 24 hours`)
    }

    // Top threat categories
    const threatCategories = recentLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topThreats = Object.entries(threatCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    // Top suspicious IPs
    const suspiciousIPs = recentLogs.reduce((acc, log) => {
      if (log.ipAddress) {
        acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topSuspiciousIPs = Object.entries(suspiciousIPs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }))

    const monitoringData = {
      summary: {
        threatLevel,
        alertConditions,
        timeRange: `${hours} hours`,
        generatedAt: new Date().toISOString()
      },
      statistics: {
        security: securityStats,
        middleware: middlewareStats,
        csrf: csrfStats
      },
      threats: {
        recentHighSeverity,
        dailyHighSeverity,
        topCategories: topThreats,
        topSuspiciousIPs
      },
      recentIncidents: recentLogs.slice(0, 20).map(log => ({
        timestamp: log.createdAt,
        type: log.type,
        severity: log.severity,
        description: log.description,
        ipAddress: log.ipAddress,
        endpoint: log.endpoint,
        userId: log.userId
      }))
    }

    // Log admin access
    await securityLogger.log({
      type: 'ADMIN_ACTION',
      severity: 'LOW',
      userId: session.user.id,
      userEmail: session.user.email,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      endpoint: '/api/admin/security-monitoring',
      description: `Security monitoring dashboard accessed (${hours}h timeframe)`,
      metadata: {
        timeRange: hours,
        threatLevel,
        alertCount: alertConditions.length
      }
    })

    return NextResponse.json(monitoringData, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Security monitoring error:', error)

    try {
      const { securityLogger } = await import('@/lib/security-logger')
      await securityLogger.log({
        type: 'API_ERROR',
        severity: 'MEDIUM',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: '/api/admin/security-monitoring',
        description: `Security monitoring API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      })
    } catch (logError) {
      console.error('Failed to log security error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to retrieve security monitoring data' },
      { status: 500 }
    )
  }
}

// Security actions endpoint (block/unblock IPs, etc.)
export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { securityLogger } = await import('@/lib/security-logger')
    const { securityMiddleware } = await import('@/lib/security-middleware')

    const session = await getServerSession(authOptions) as any

    // Check if user is admin
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { action, target, reason } = body

    if (!action || !target) {
      return NextResponse.json(
        { error: 'Action and target are required' },
        { status: 400 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'unblock_ip':
        const unblocked = securityMiddleware.unblockIP(target)
        result = { success: unblocked, message: unblocked ? 'IP unblocked' : 'IP not found' }

        await securityLogger.log({
          type: 'ADMIN_ACTION',
          severity: 'MEDIUM',
          userId: session.user.id,
          userEmail: session.user.email,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
          endpoint: '/api/admin/security-monitoring',
          description: `Admin ${unblocked ? 'unblocked' : 'attempted to unblock'} IP: ${target}`,
          metadata: {
            action,
            target,
            reason,
            success: unblocked
          }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

    return NextResponse.json(result, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    })

  } catch (error) {
    console.error('Security action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform security action' },
      { status: 500 }
    )
  }
}