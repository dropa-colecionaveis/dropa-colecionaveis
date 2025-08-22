import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to view stats
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { getSystemStats } = await import('@/lib/admin-actions')
    const stats = await getSystemStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}