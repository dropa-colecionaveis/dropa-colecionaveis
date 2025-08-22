import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { withAdminAuthAndAudit } = await import('@/middleware/admin-auth')
    
    const handler = withAdminAuthAndAudit(
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
    
    return handler(req)
  } catch (error) {
    console.error('POST handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}