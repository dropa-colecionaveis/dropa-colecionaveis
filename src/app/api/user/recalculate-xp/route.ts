import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calcular XP total baseado nas achievements completadas
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.user.id,
        isCompleted: true
      },
      include: {
        achievement: true
      }
    })

    const totalXPFromAchievements = userAchievements.reduce((sum, ua) => {
      return sum + ua.achievement.points
    }, 0)

    // Atualizar UserStats com o XP correto
    const updatedStats = await prisma.userStats.upsert({
      where: { userId: session.user.id },
      update: {
        totalXP: totalXPFromAchievements,
        level: Math.floor(Math.sqrt(totalXPFromAchievements / 100)) + 1,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        totalXP: totalXPFromAchievements,
        level: Math.floor(Math.sqrt(totalXPFromAchievements / 100)) + 1,
        lastActivityAt: new Date()
      }
    })

    console.log(`🔄 Recalculated XP for user ${session.user.id}:`, {
      achievementsCount: userAchievements.length,
      calculatedXP: totalXPFromAchievements,
      currentLevel: updatedStats.level,
      previousXP: updatedStats.totalXP
    })

    return NextResponse.json({
      success: true,
      xp: {
        total: totalXPFromAchievements,
        level: updatedStats.level,
        achievementsCount: userAchievements.length
      }
    })
    
  } catch (error) {
    console.error('Error recalculating XP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}