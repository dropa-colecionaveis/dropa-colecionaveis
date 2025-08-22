import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuthAndAudit } from '@/middleware/admin-auth'

export const POST = withAdminAuthAndAudit(
  async (req: NextRequest, authResult) => {
    try {
      const { generateSystemReport } = await import('@/lib/admin-actions')
      const result = await generateSystemReport(authResult.user!)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Generate report error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  },
  'SYSTEM_REPORT_GENERATED',
  () => 'Gerou relatório do sistema'
)