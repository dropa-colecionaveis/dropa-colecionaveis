import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Busca recompensas disponíveis para o usuário baseado no streak atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Buscar stats do usuário
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    })

    if (!userStats) {
      // Usuário não tem stats ainda, inicializar
      const { userStatsService } = await import('@/lib/user-stats')
      await userStatsService.initializeUserStats(userId)
      
      const newUserStats = await prisma.userStats.findUnique({
        where: { userId }
      })
      
      if (!newUserStats) {
        throw new Error('Failed to initialize user stats')
      }
    }

    const currentStreak = userStats?.currentStreak || 1
    const today = new Date()
    
    // Calcular o dia do ciclo (1-7)
    const cycleDay = ((currentStreak - 1) % 7) + 1

    // Buscar todas as recompensas ativas
    const allRewards = await prisma.dailyReward.findMany({
      where: { isActive: true },
      orderBy: { day: 'asc' },
      include: {
        packType: {
          select: {
            id: true,
            name: true,
            displayName: true,
            emoji: true,
            color: true
          }
        }
      }
    })

    // Buscar recompensa de hoje
    const todayReward = allRewards.find(r => r.day === cycleDay)
    
    // Verificar se já foi reclamada hoje
    let hasClaimedToday = false
    let todayClaim = null
    
    if (todayReward) {
      const todayBrasil = new Date(today.toLocaleString('en-US', {
        timeZone: 'America/Sao_Paulo'
      }))
      
      const startOfDay = new Date(todayBrasil.getFullYear(), todayBrasil.getMonth(), todayBrasil.getDate(), 0, 0, 0)
      const endOfDay = new Date(todayBrasil.getFullYear(), todayBrasil.getMonth(), todayBrasil.getDate(), 23, 59, 59, 999)
      
      // Converter para UTC
      const startOfDayUTC = new Date(startOfDay.getTime() + (3 * 60 * 60 * 1000))
      const endOfDayUTC = new Date(endOfDay.getTime() + (3 * 60 * 60 * 1000))
      
      todayClaim = await prisma.dailyRewardClaim.findFirst({
        where: {
          userId,
          rewardId: todayReward.id,
          claimedAt: {
            gte: startOfDayUTC,
            lte: endOfDayUTC
          }
        }
      })
      
      hasClaimedToday = !!todayClaim
    }

    // Calcular multiplicador de bonus baseado no streak
    let bonusMultiplier = 1
    if (currentStreak >= 31) {
      bonusMultiplier = 1.3 // 30% bonus
    } else if (currentStreak >= 15) {
      bonusMultiplier = 1.2 // 20% bonus
    } else if (currentStreak >= 8) {
      bonusMultiplier = 1.1 // 10% bonus
    }

    // Preparar próximas recompensas (preview dos próximos 7 dias)
    const upcomingRewards = []
    for (let i = 1; i <= 7; i++) {
      const dayReward = allRewards.find(r => r.day === i)
      if (dayReward) {
        const adjustedValue = Math.floor(dayReward.rewardValue * bonusMultiplier)
        upcomingRewards.push({
          ...dayReward,
          adjustedValue,
          bonusMultiplier,
          isCurrent: i === cycleDay,
          canClaim: i === cycleDay && !hasClaimedToday
        })
      }
    }

    return NextResponse.json({
      currentStreak,
      cycleDay,
      bonusMultiplier,
      todayReward: todayReward ? {
        ...todayReward,
        adjustedValue: Math.floor(todayReward.rewardValue * bonusMultiplier),
        canClaim: !hasClaimedToday,
        claimed: hasClaimedToday,
        claimedAt: todayClaim?.claimedAt || null
      } : null,
      upcomingRewards,
      hasClaimedToday
    })
  } catch (error) {
    console.error('Error fetching daily rewards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}