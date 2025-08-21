import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuthAndAudit } from '@/middleware/admin-auth'
import { createSystemBackup } from '@/lib/admin-actions'
import { AUDIT_ACTIONS } from '@/lib/audit-log'

export const POST = withAdminAuthAndAudit(
  async (req: NextRequest, authResult) => {
    try {
      const result = await createSystemBackup(authResult.user!)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Create backup error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  },
  AUDIT_ACTIONS.SYSTEM_BACKUP,
  (req) => 'Criou backup do sistema'
)