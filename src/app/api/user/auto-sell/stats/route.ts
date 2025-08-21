import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autoSellService } from '@/lib/auto-sell'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
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