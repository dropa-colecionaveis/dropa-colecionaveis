import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { userStatsService } = await import('@/lib/user-stats')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calcular estatísticas em tempo real para garantir precisão
    const { prisma } = await import('@/lib/prisma')

    // Buscar dados reais em paralelo
    const [
      totalPacksOpened,
      totalItemsCollected,
      legendaryItems,
      userStatsRecord
    ] = await Promise.all([
      // Total de pacotes abertos
      prisma.packOpening.count({
        where: { userId: session.user.id }
      }),

      // Total de itens coletados
      prisma.userItem.count({
        where: { userId: session.user.id }
      }),

      // Itens lendários
      prisma.userItem.count({
        where: {
          userId: session.user.id,
          item: {
            rarity: 'LENDARIO'
          }
        }
      }),

      // Buscar registro da UserStats para outros dados (XP, etc)
      userStatsService.getRankingStats(session.user.id)
    ])

    // Criar objeto com dados atualizados
    const userStats = {
      ...userStatsRecord,
      totalPacksOpened,
      totalItemsCollected,
      legendaryItemsFound: legendaryItems,
      lastUpdated: new Date()
    }

    // Tentar buscar do cache para dados menos críticos
    const { achievementCache } = await import('@/lib/achievement-cache')
    achievementCache.setUserStats(session.user.id, userStats, 2 * 60 * 1000)

    // Calcular XP correto apenas das conquistas
    const { achievementEngine } = await import('@/lib/achievements')
    const userAchievements = await achievementEngine.getUserAchievements(session.user.id)
    const correctTotalXP = userAchievements
      .filter(ua => ua.isCompleted)
      .reduce((sum, ua) => sum + ua.achievement.points, 0)

    // Calcular informações de nível baseado no XP correto
    const levelProgress = userStatsService.getLevelProgress(correctTotalXP)
    
    // Calcular tempo desde última atividade
    const timeSinceLastActivity = userStats.lastActivityAt 
      ? Date.now() - new Date(userStats.lastActivityAt).getTime()
      : null

    return NextResponse.json({
      ...userStats,
      totalXP: correctTotalXP, // Substitui o totalXP incorreto pelo correto
      level: levelProgress.currentLevel,
      levelProgress,
      timeSinceLastActivity,
      isActive: timeSinceLastActivity ? timeSinceLastActivity < 24 * 60 * 60 * 1000 : false, // ativo nas últimas 24h
      badges: await getUserBadges(session.user.id, { ...userStats, totalXP: correctTotalXP })
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Calcular badges baseados nas estatísticas
async function getUserBadges(userId: string, stats: any): Promise<Array<{
  name: string,
  icon: string,
  description: string,
  color: string
}>> {
  const badges = []

  // Badge de nível
  if (stats.level >= 10) {
    badges.push({
      name: 'Veterano',
      icon: '⭐',
      description: 'Alcançou nível 10+',
      color: 'gold'
    })
  } else if (stats.level >= 5) {
    badges.push({
      name: 'Experiente',
      icon: '🌟',
      description: 'Alcançou nível 5+',
      color: 'silver'
    })
  }

  // Badge de colecionador
  if (stats.totalItemsCollected >= 100) {
    badges.push({
      name: 'Colecionador Mestre',
      icon: '🏆',
      description: '100+ itens coletados',
      color: 'gold'
    })
  } else if (stats.totalItemsCollected >= 50) {
    badges.push({
      name: 'Colecionador',
      icon: '📦',
      description: '50+ itens coletados',
      color: 'blue'
    })
  }

  // Badge de comerciante
  if (stats.marketplaceSales >= 25) {
    badges.push({
      name: 'Comerciante',
      icon: '💰',
      description: '25+ vendas no marketplace',
      color: 'green'
    })
  }

  // Badge de raridade
  if (stats.legendaryItemsFound >= 5) {
    badges.push({
      name: 'Caçador de Lendas',
      icon: '💎',
      description: '5+ itens lendários',
      color: 'purple'
    })
  }

  // Badge de streak
  if (stats.longestStreak >= 30) {
    badges.push({
      name: 'Dedicado',
      icon: '🔥',
      description: 'Streak de 30+ dias',
      color: 'red'
    })
  } else if (stats.longestStreak >= 7) {
    badges.push({
      name: 'Consistente',
      icon: '🎯',
      description: 'Streak de 7+ dias',
      color: 'orange'
    })
  }

  return badges
}