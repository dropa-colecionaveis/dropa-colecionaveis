import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuthAndAudit } from '@/middleware/admin-auth'

export const POST = withAdminAuthAndAudit(
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