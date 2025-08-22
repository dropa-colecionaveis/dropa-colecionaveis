import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { withAdminAuthAndAudit } = await import('@/middleware/admin-auth')
    
    const handler = withAdminAuthAndAudit(
      async (req: NextRequest, authResult) => {
        try {
          const { resetTestData } = await import('@/lib/admin-actions')
          const result = await resetTestData(authResult.user!)
          return NextResponse.json(result)
        } catch (error) {
          console.error('Reset test data error:', error)
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
          )
        }
      },
      'SYSTEM_RESET_TEST_DATA',
      () => 'Resetou dados de teste do sistema',
      'SUPER_ADMIN' // Apenas super admin pode resetar dados
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