import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { achievementEngine } from '@/lib/achievements'

export async function GET(req: Request) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      return NextResponse.json({
        achievements: [],
        categories: ['COLLECTOR', 'EXPLORER', 'TRADER', 'MILESTONE', 'SPECIAL']
      })
    }

    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const includeSecret = searchParams.get('includeSecret') === 'true'
    
    // Lista todas as conquistas disponíveis
    const where: any = { isActive: true }
    
    if (category) {
      where.category = category
    }
    
    if (!includeSecret) {
      where.isSecret = false
    }
    
    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { points: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        category: true,
        type: true,
        points: true,
        isSecret: true,
        _count: {
          select: {
            userAchievements: {
              where: { isCompleted: true }
            }
          }
        }
      }
    })

    // Se usuário está logado, incluir progresso
    let achievementsWithProgress = achievements
    
    if (session?.user?.id) {
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: session.user.id },
        select: {
          achievementId: true,
          progress: true,
          isCompleted: true,
          unlockedAt: true
        }
      })

      const userAchievementMap = new Map(
        userAchievements.map(ua => [ua.achievementId, ua])
      )

      achievementsWithProgress = achievements.map(achievement => ({
        ...achievement,
        userProgress: userAchievementMap.get(achievement.id) || {
          progress: 0,
          isCompleted: false,
          unlockedAt: null
        },
        completionRate: Math.round(
          (achievement._count.userAchievements / Math.max(1, achievements.length)) * 100
        )
      }))
    }

    return NextResponse.json({
      achievements: achievementsWithProgress,
      categories: [
        'COLLECTOR',
        'EXPLORER', 
        'TRADER',
        'MILESTONE',
        'SPECIAL'
      ]
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Not available during build' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, achievementId, eventData } = await req.json()

    if (action === 'check') {
      // Verificar conquistas manualmente baseado em evento
      if (!eventData || !eventData.type) {
        return NextResponse.json(
          { error: 'Event data is required' },
          { status: 400 }
        )
      }

      const unlockedAchievements = await achievementEngine.checkAchievements({
        ...eventData,
        userId: session.user.id
      })

      return NextResponse.json({
        unlockedAchievements,
        message: unlockedAchievements.length > 0 
          ? `${unlockedAchievements.length} achievement(s) unlocked!`
          : 'No new achievements unlocked'
      })
    }

    if (action === 'unlock' && achievementId) {
      // Para admin ou testes - unlock manual
      await achievementEngine.unlockAchievement(session.user.id, achievementId)
      
      return NextResponse.json({
        message: 'Achievement unlocked successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in achievements POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}