import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST() {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { resetBrokenStreaks } = await import('@/lib/streak-calculator')
    const { rankingService } = await import('@/lib/rankings')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    console.log('🔧 Admin triggered streak reset')
    
    // Resetar streaks quebrados
    const result = await resetBrokenStreaks()
    
    // Atualizar ranking semanal após resetar streaks
    await rankingService.updateRanking('WEEKLY_ACTIVE', undefined, true)
    
    console.log(`✅ Reset completed: ${result.updated} streaks updated`)

    return NextResponse.json({
      success: true,
      message: `Reset completed successfully`,
      streaksReset: result.updated
    })

  } catch (error) {
    console.error('Error resetting broken streaks:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { calculateCurrentStreaksForUsers } = await import('@/lib/streak-calculator')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    // Buscar usuários com streak > 0
    const usersWithStreak = await prisma.userStats.findMany({
      where: {
        currentStreak: { gt: 0 }
      },
      select: {
        userId: true,
        currentStreak: true,
        lastActivityAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        currentStreak: 'desc'
      },
      take: 20
    })

    const userIds = usersWithStreak.map(u => u.userId)
    const actualStreaks = await calculateCurrentStreaksForUsers(userIds)

    const streakComparison = usersWithStreak.map(user => ({
      userId: user.userId,
      username: user.user.name || user.user.email,
      storedStreak: user.currentStreak,
      actualStreak: actualStreaks[user.userId] || 0,
      lastActivity: user.lastActivityAt,
      needsReset: user.currentStreak > 0 && (actualStreaks[user.userId] || 0) === 0
    }))

    return NextResponse.json({
      success: true,
      comparison: streakComparison,
      totalUsers: usersWithStreak.length,
      needingReset: streakComparison.filter(u => u.needsReset).length
    })

  } catch (error) {
    console.error('Error checking streaks:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}