import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { performanceMonitor } = await import('@/lib/ranking-performance')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Only allow admin users to access performance metrics
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
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
