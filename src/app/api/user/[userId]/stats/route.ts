import { NextResponse } from 'next/server'
import { userStatsService } from '@/lib/user-stats'
import { rankingService } from '@/lib/rankings'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const userId = params.userId
    
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Obter stats do usuário
    const userStats = await userStatsService.getRankingStats(userId)
    
    if (!userStats) {
      return NextResponse.json(
        { error: 'User stats not found' },
        { status: 404 }
      )
    }

    // Obter conquistas do usuário
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId,
        isCompleted: true
      },
      include: {
        achievement: {
          select: {
            name: true,
            icon: true,
            category: true,
            points: true
          }
        }
      },
      orderBy: { unlockedAt: 'desc' },
      take: 10
    })

    // Calcular informações de nível
    const levelProgress = userStatsService.getLevelProgress(userStats.totalXP)
    
    // Obter rankings do usuário
    const userRankings = await rankingService.getUserRankings(userId)

    // Calcular badges
    const badges = []

    // Badge de nível
    if (userStats.level >= 20) {
      badges.push({
        name: 'Lenda',
        icon: '👑',
        description: 'Nível 20+',
        color: 'purple'
      })
    } else if (userStats.level >= 10) {
      badges.push({
        name: 'Veterano',
        icon: '⭐',
        description: 'Nível 10+',
        color: 'gold'
      })
    } else if (userStats.level >= 5) {
      badges.push({
        name: 'Experiente',
        icon: '🌟',
        description: 'Nível 5+',
        color: 'silver'
      })
    }

    // Badge de colecionador
    if (userStats.totalItemsCollected >= 500) {
      badges.push({
        name: 'Colecionador Supremo',
        icon: '👑',
        description: '500+ itens',
        color: 'purple'
      })
    } else if (userStats.totalItemsCollected >= 100) {
      badges.push({
        name: 'Colecionador Mestre',
        icon: '🏆',
        description: '100+ itens',
        color: 'gold'
      })
    } else if (userStats.totalItemsCollected >= 50) {
      badges.push({
        name: 'Colecionador',
        icon: '📦',
        description: '50+ itens',
        color: 'blue'
      })
    }

    // Badge de raridades
    if (userStats.legendaryItemsFound >= 10) {
      badges.push({
        name: 'Mestre das Lendas',
        icon: '💎',
        description: '10+ lendários',
        color: 'purple'
      })
    } else if (userStats.legendaryItemsFound >= 1) {
      badges.push({
        name: 'Caçador de Lendas',
        icon: '⭐',
        description: 'Item lendário encontrado',
        color: 'gold'
      })
    }

    // Badge de comerciante
    if (userStats.marketplaceSales >= 100) {
      badges.push({
        name: 'Magnata',
        icon: '💰',
        description: '100+ vendas',
        color: 'green'
      })
    } else if (userStats.marketplaceSales >= 25) {
      badges.push({
        name: 'Comerciante',
        icon: '🛒',
        description: '25+ vendas',
        color: 'blue'
      })
    }

    // Badge de streak
    if (userStats.longestStreak >= 100) {
      badges.push({
        name: 'Inabalável',
        icon: '🔥',
        description: 'Streak de 100+ dias',
        color: 'red'
      })
    } else if (userStats.longestStreak >= 30) {
      badges.push({
        name: 'Dedicado',
        icon: '🎯',
        description: 'Streak de 30+ dias',
        color: 'orange'
      })
    } else if (userStats.longestStreak >= 7) {
      badges.push({
        name: 'Consistente',
        icon: '📅',
        description: 'Streak de 7+ dias',
        color: 'blue'
      })
    }

    // Calcular tempo de jogo
    const accountAge = Date.now() - new Date(user.createdAt).getTime()
    const daysPlaying = Math.floor(accountAge / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        daysPlaying
      },
      stats: userStats,
      levelProgress,
      rankings: userRankings,
      achievements: {
        recent: userAchievements,
        total: userAchievements.length,
        totalPoints: userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0)
      },
      badges,
      isActive: userStats.lastActivityAt 
        ? Date.now() - new Date(userStats.lastActivityAt).getTime() < 24 * 60 * 60 * 1000
        : false
    })
  } catch (error) {
    console.error(`Error fetching user stats for ${params.userId}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}