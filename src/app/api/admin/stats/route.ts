import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/admin-auth'
import { getSystemStats } from '@/lib/admin-actions'

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const stats = await getSystemStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})