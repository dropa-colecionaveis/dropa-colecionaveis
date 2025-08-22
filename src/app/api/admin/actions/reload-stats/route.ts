import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { withAdminAuthAndAudit } = await import('@/middleware/admin-auth')
    const { AUDIT_ACTIONS } = await import('@/lib/audit-log')
    
    const handler = withAdminAuthAndAudit(
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
      AUDIT_ACTIONS.SYSTEM_STATS_VIEW,
      () => 'Recarregou estatísticas do sistema'
    )
    
    return handler(req)
  } catch (error) {
    console.error('POST handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}