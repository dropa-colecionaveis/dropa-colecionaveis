import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { statsMonitor } = await import('@/lib/stats-monitor')
    const { statsAuditLogger } = await import('@/lib/stats-audit-logger')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { verifyAdminAuth } = await import('@/lib/admin-auth')
    const adminAuth = await verifyAdminAuth()
    if (!adminAuth.success) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: adminAuth.statusCode || 403 })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'status') {
      // Status atual do monitoramento
      const currentStatus = await statsMonitor.getCurrentHealthStatus()
      const integrityReport = await statsAuditLogger.getIntegrityReport(24) // últimas 24h
      
      return NextResponse.json({
        success: true,
        currentStatus,
        integrityReport,
        monitoringActive: true // Assumindo que está ativo
      })
      
    } else if (action === 'history') {
      // Histórico de monitoramento
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const history = await statsMonitor.getMonitoringHistory(limit)
      
      return NextResponse.json({
        success: true,
        history
      })
      
    } else if (action === 'audit-history') {
      // Histórico de auditoria
      const userId = url.searchParams.get('userId')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      
      if (userId) {
        const userHistory = await statsAuditLogger.getUserAuditHistory(userId, limit)
        return NextResponse.json({
          success: true,
          userHistory
        })
      } else {
        const failedOps = await statsAuditLogger.getFailedOperations(24, limit)
        return NextResponse.json({
          success: true,
          failedOperations: failedOps
        })
      }
      
    } else if (action === 'run-check') {
      // Executar verificação manual
      const result = await statsMonitor.runMonitoringCycle()
      
      return NextResponse.json({
        success: true,
        result
      })
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use: status, history, audit-history, or run-check' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Stats monitoring API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { statsMonitor } = await import('@/lib/stats-monitor')
    const { integrityGuard } = await import('@/lib/integrity-guard')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { verifyAdminAuth } = await import('@/lib/admin-auth')
    const adminAuth = await verifyAdminAuth()
    if (!adminAuth.success) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: adminAuth.statusCode || 403 })
    }

    const { action, data } = await req.json()

    if (action === 'start-monitoring') {
      // Iniciar monitoramento
      const intervalMinutes = data?.intervalMinutes || 30
      statsMonitor.startMonitoring(intervalMinutes)
      
      return NextResponse.json({
        success: true,
        message: `Monitoring started with ${intervalMinutes} minute interval`
      })
      
    } else if (action === 'stop-monitoring') {
      // Parar monitoramento
      statsMonitor.stopMonitoring()
      
      return NextResponse.json({
        success: true,
        message: 'Monitoring stopped'
      })
      
    } else if (action === 'manual-integrity-check') {
      // Verificação manual de integridade
      const userId = data?.userId
      const result = await integrityGuard.performManualIntegrityCheck(userId)
      
      return NextResponse.json({
        success: true,
        result
      })
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use: start-monitoring, stop-monitoring, or manual-integrity-check' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Stats monitoring control error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}