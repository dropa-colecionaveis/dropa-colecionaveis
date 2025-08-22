import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { rankingScheduler } = await import('@/lib/ranking-scheduler')
    
    const session = await getServerSession(authOptions)
    
    // Verificar se é admin (você pode ajustar essa verificação)
    if (!session?.user?.email || !session.user.email.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const isRunning = rankingScheduler.isRunning()

    return NextResponse.json({
      isRunning,
      status: isRunning ? 'Running' : 'Stopped',
      message: isRunning 
        ? 'Ranking scheduler is actively updating rankings every hour'
        : 'Ranking scheduler is stopped'
    })
  } catch (error) {
    console.error('Error checking scheduler status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { rankingScheduler } = await import('@/lib/ranking-scheduler')
    
    const session = await getServerSession(authOptions)
    
    // Verificar se é admin
    if (!session?.user?.email || !session.user.email.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { action } = await req.json()

    switch (action) {
      case 'start':
        rankingScheduler.start()
        return NextResponse.json({
          message: 'Ranking scheduler started successfully',
          isRunning: true
        })

      case 'stop':
        rankingScheduler.stop()
        return NextResponse.json({
          message: 'Ranking scheduler stopped',
          isRunning: false
        })

      case 'update-now':
        await rankingScheduler.updateRankings()
        return NextResponse.json({
          message: 'Rankings updated successfully',
          timestamp: new Date().toISOString()
        })

      case 'schedule-update':
        const { delayMs = 5000 } = await req.json()
        rankingScheduler.scheduleUpdate(delayMs)
        return NextResponse.json({
          message: `Ranking update scheduled in ${delayMs}ms`,
          scheduledTime: new Date(Date.now() + delayMs).toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, update-now, or schedule-update' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}