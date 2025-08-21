import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuthAndAudit } from '@/middleware/admin-auth'
import { reloadSystemStats } from '@/lib/admin-actions'
import { AUDIT_ACTIONS } from '@/lib/audit-log'

export const POST = withAdminAuthAndAudit(
  async (req: NextRequest, authResult) => {
    try {
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
  AUDIT_ACTIONS.SYSTEM_STATS_VIEW,
  () => 'Recarregou estatísticas do sistema'
)