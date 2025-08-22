import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { autoSellService } = await import('@/lib/auto-sell')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    const includeHistory = searchParams.get('includeHistory') === 'true'

    const stats = await autoSellService.getAutoSellStats(session.user.id, days)

    let history: any[] = []
    if (includeHistory) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      history = await prisma.autoSellLog.findMany({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limitar a 50 registros mais recentes
      })
    }

    return NextResponse.json({
      stats,
      history
    })
  } catch (error) {
    console.error('Auto-sell stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}