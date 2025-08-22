import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuthAndAudit } from '@/middleware/admin-auth'

export const POST = withAdminAuthAndAudit(
  async (req: NextRequest, authResult) => {
    try {
      const { reloadSystemStats } = await import('@/lib/admin-actions')
      const result = await reloadSystemStats(authResult.user!)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Reload stats error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  },
  (await import('@/lib/audit-log')).AUDIT_ACTIONS.SYSTEM_STATS_VIEW,
  () => 'Recarregou estatísticas do sistema'
)