import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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
    
    // Verificar se já foi reclamada (mesma lógica do claim endpoint)
    let hasClaimedToday = false
    let todayClaim = null
    
    if (todayReward) {
      todayClaim = await prisma.dailyRewardClaim.findFirst({
        where: {
          userId,
          rewardId: todayReward.id,
          streakDay: currentStreak
        }
      })
      
      hasClaimedToday = !!todayClaim
    }

    // Calcular bônus fixo baseado no streak
    let bonusCredits = 0
    let bonusTier = ''
    if (currentStreak >= 31) {
      bonusCredits = 3  // +3 créditos (Ouro)
      bonusTier = 'Ouro'
    } else if (currentStreak >= 15) {
      bonusCredits = 2  // +2 créditos (Prata)
      bonusTier = 'Prata'
    } else if (currentStreak >= 8) {
      bonusCredits = 1  // +1 crédito (Bronze)
      bonusTier = 'Bronze'
    }

    // Preparar próximas recompensas (preview dos próximos 7 dias)
    const upcomingRewards = []
    for (let i = 1; i <= 7; i++) {
      const dayReward = allRewards.find(r => r.day === i)
      if (dayReward) {
        // Só aplicar bônus em recompensas de créditos
        const adjustedValue = dayReward.rewardType === 'CREDITS' 
          ? dayReward.rewardValue + bonusCredits
          : dayReward.rewardValue
        
        upcomingRewards.push({
          ...dayReward,
          adjustedValue,
          bonusCredits,
          bonusTier,
          isCurrent: i === cycleDay,
          canClaim: i === cycleDay && !hasClaimedToday
        })
      }
    }

    return NextResponse.json({
      currentStreak,
      cycleDay,
      bonusCredits,
      bonusTier,
      todayReward: todayReward ? {
        ...todayReward,
        adjustedValue: todayReward.rewardType === 'CREDITS' 
          ? todayReward.rewardValue + bonusCredits 
          : todayReward.rewardValue,
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