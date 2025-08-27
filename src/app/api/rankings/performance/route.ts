import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { performanceMonitor } from '@/lib/ranking-performance'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)

    // Only allow admin users to access performance metrics
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = performanceMonitor.getStats()
        return NextResponse.json(stats)

      case 'report':
        const report = await performanceMonitor.getPerformanceReport()
        return NextResponse.json(report)

      case 'reset':
        performanceMonitor.reset()
        return NextResponse.json({ success: true, message: 'Performance metrics reset' })

      default:
        // Return basic stats by default
        const basicStats = performanceMonitor.getStats()
        return NextResponse.json(basicStats)
    }
  } catch (error) {
    console.error('Error in performance monitoring API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}