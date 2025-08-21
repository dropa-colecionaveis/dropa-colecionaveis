import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userStatsService } from '@/lib/user-stats'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userStats = await userStatsService.getRankingStats(session.user.id)
    
    if (!userStats) {
      return NextResponse.json(
        { error: 'User stats not found' },
        { status: 404 }
      )
    }

    // Calcular informações de nível
    const levelProgress = userStatsService.getLevelProgress(userStats.totalXP)
    
    // Calcular tempo desde última atividade
    const timeSinceLastActivity = userStats.lastActivityAt 
      ? Date.now() - new Date(userStats.lastActivityAt).getTime()
      : null

    return NextResponse.json({
      ...userStats,
      levelProgress,
      timeSinceLastActivity,
      isActive: timeSinceLastActivity ? timeSinceLastActivity < 24 * 60 * 60 * 1000 : false, // ativo nas últimas 24h
      badges: await getUserBadges(session.user.id, userStats)
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