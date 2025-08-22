import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuthAndAudit } from '@/middleware/admin-auth'

export const POST = withAdminAuthAndAudit(
  async (req: NextRequest, authResult) => {
    try {
      const { createSystemBackup } = await import('@/lib/admin-actions')
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
  (await import('@/lib/audit-log')).AUDIT_ACTIONS.SYSTEM_BACKUP,
  (req) => 'Criou backup do sistema'
)