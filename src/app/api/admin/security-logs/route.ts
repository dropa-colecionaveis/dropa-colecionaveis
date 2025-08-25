import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const { securityLogger } = await import('@/lib/security-logger')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      await securityLogger.logUnauthorizedAccess(
        '/api/admin/security-logs',
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip || undefined,
        req.headers.get('user-agent') || undefined,
        undefined
      )
      
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    
    // Parse query parameters
    const type = searchParams.get('type') as any
    const severity = searchParams.get('severity') as any
    const userId = searchParams.get('userId') || undefined
    const ipAddress = searchParams.get('ipAddress') || undefined
    const hours = parseInt(searchParams.get('hours') || '24')
    const limit = parseInt(searchParams.get('limit') || '100')
    const action = searchParams.get('action') || 'logs'

    if (action === 'stats') {
      // Return security statistics
      const stats = await securityLogger.getSecurityStats(hours)
      
      return NextResponse.json({
        success: true,
        stats
      })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Search logs
    const logs = await securityLogger.searchLogs(
      {
        type,
        severity,
        userId,
        ipAddress,
        startDate,
        endDate
      },
      limit
    )

    // Log admin access
    await securityLogger.log({
      type: 'ADMIN_ACTION',
      severity: 'LOW',
      userId: authResult.user?.id,
      userEmail: authResult.user?.email,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      endpoint: '/api/admin/security-logs',
      method: 'GET',
      description: 'Admin accessed security logs',
      metadata: {
        filters: { type, severity, userId, ipAddress },
        hours,
        limit,
        resultCount: logs.length
      }
    })

    return NextResponse.json({
      success: true,
      logs,
      filters: { type, severity, userId, ipAddress, hours, limit },
      total: logs.length
    })

  } catch (error) {
    console.error('Error fetching security logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { securityLogger } = await import('@/lib/security-logger')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '90')

    // Cleanup old logs
    const deletedCount = await securityLogger.cleanupOldLogs(days)

    // Log admin action
    await securityLogger.log({
      type: 'ADMIN_ACTION',
      severity: 'MEDIUM',
      userId: authResult.user?.id,
      userEmail: authResult.user?.email,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip || undefined,
      description: `Admin cleaned up security logs older than ${days} days`,
      metadata: {
        daysOld: days,
        deletedCount
      }
    })

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old security logs`,
      deletedCount,
      daysOld: days
    })

  } catch (error) {
    console.error('Error cleaning up security logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}