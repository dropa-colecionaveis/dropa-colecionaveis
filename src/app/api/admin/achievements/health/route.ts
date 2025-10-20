import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // Verificar se usuário é admin (usando mesma lógica do admin panel)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Executar monitoramento de saúde
    const healthData = await generateHealthReport()
    
    return NextResponse.json(healthData)
  } catch (error) {
    console.error('Error generating achievement health report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateHealthReport() {
  const { prisma } = await import('@/lib/prisma')
  
  // 1. Estatísticas Gerais
  const totalAchievements = await prisma.achievement.count()
  const activeAchievements = await prisma.achievement.count({ where: { isActive: true } })
  const totalUsers = await prisma.user.count()
  const usersWithAchievements = await prisma.userAchievement.groupBy({
    by: ['userId'],
    _count: { userId: true }
  })
  
  const engagementRate = Math.round((usersWithAchievements.length / Math.max(1, totalUsers)) * 100)
  
  // 2. Distribuição por Categoria (otimizada com batch query)
  const achievementsByCategory = await prisma.achievement.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { isActive: true }
  })
  
  // Otimização: fazer uma única query para todas as categorias
  const categoryUnlocks = await prisma.userAchievement.findMany({
    where: { 
      isCompleted: true,
      achievement: { isActive: true }
    },
    select: {
      achievement: {
        select: { category: true }
      }
    }
  })
  
  // Criar mapa para lookup rápido
  const unlocksByCategory = new Map()
  for (const unlock of categoryUnlocks) {
    const category = unlock.achievement.category
    unlocksByCategory.set(category, (unlocksByCategory.get(category) || 0) + 1)
  }
  
  const categoryStats = achievementsByCategory.map(cat => {
    const unlockedInCategory = unlocksByCategory.get(cat.category) || 0
    const totalPossible = cat._count.id * totalUsers
    const unlockRate = totalPossible > 0 ? Math.round((unlockedInCategory / totalPossible) * 100) : 0
    
    return {
      category: cat.category,
      totalAchievements: cat._count.id,
      unlockRate,
      unlockedCount: unlockedInCategory
    }
  })
  
  // 3. Top 10 Conquistas Mais Desbloqueadas (otimizada)
  const topAchievements = await prisma.userAchievement.groupBy({
    by: ['achievementId'],
    _count: { achievementId: true },
    where: { isCompleted: true },
    orderBy: { _count: { achievementId: 'desc' } },
    take: 10
  })
  
  // Buscar detalhes de todas as conquistas em uma única query
  const achievementIds = topAchievements.map(ta => ta.achievementId)
  const achievementDetails = await prisma.achievement.findMany({
    where: { id: { in: achievementIds } },
    select: { id: true, name: true, category: true }
  })
  
  // Criar mapa para lookup rápido
  const achievementMap = new Map(achievementDetails.map(a => [a.id, a]))
  
  const topAchievementsWithDetails = topAchievements.map(ta => {
    const achievement = achievementMap.get(ta.achievementId)
    const percentage = Math.round((ta._count.achievementId / Math.max(1, totalUsers)) * 100)
    
    return {
      name: achievement?.name || 'Unknown',
      category: achievement?.category || 'Unknown',
      unlockedCount: ta._count.achievementId,
      percentage
    }
  })
  
  // 4. Conquistas Nunca Desbloqueadas
  const allAchievementIds = await prisma.achievement.findMany({
    where: { isActive: true },
    select: { id: true, name: true, category: true }
  })
  
  const unlockedAchievementIds = await prisma.userAchievement.findMany({
    where: { isCompleted: true },
    select: { achievementId: true },
    distinct: ['achievementId']
  })
  
  const unlockedIds = new Set(unlockedAchievementIds.map(ua => ua.achievementId))
  const neverUnlocked = allAchievementIds.filter(ach => !unlockedIds.has(ach.id))
  
  // 5. Atividade Recente (últimas 24h)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const recentUnlocks = await prisma.userAchievement.count({
    where: {
      isCompleted: true,
      unlockedAt: { gte: yesterday }
    }
  })
  
  const recentUsers = await prisma.userAchievement.findMany({
    where: {
      isCompleted: true,
      unlockedAt: { gte: yesterday }
    },
    select: { userId: true },
    distinct: ['userId']
  })
  
  // 6. Alertas de Saúde
  const alerts = []
  
  if (engagementRate < 50) {
    alerts.push({
      type: 'warning',
      message: `Taxa de engajamento baixa: ${engagementRate}% (esperado: >50%)`
    })
  }
  
  const neverUnlockedRate = (neverUnlocked.length / Math.max(1, totalAchievements)) * 100
  if (neverUnlockedRate > 70) {
    alerts.push({
      type: 'error',
      message: `Muitas conquistas não funcionam: ${neverUnlocked.length}/${totalAchievements} (${Math.round(neverUnlockedRate)}%)`
    })
  }
  
  if (recentUnlocks === 0 && totalUsers > 0) {
    alerts.push({
      type: 'warning',
      message: 'Nenhuma conquista desbloqueada nas últimas 24h'
    })
  }
  
  // 7. Score de Saúde
  let healthScore = 100
  
  if (neverUnlockedRate > 50) healthScore -= 30
  else if (neverUnlockedRate > 30) healthScore -= 20
  else if (neverUnlockedRate > 10) healthScore -= 10
  
  if (engagementRate < 30) healthScore -= 25
  else if (engagementRate < 50) healthScore -= 15
  else if (engagementRate < 70) healthScore -= 10
  
  if (recentUnlocks === 0) healthScore -= 20
  else if (recentUnlocks < 5) healthScore -= 10
  
  let status = '🟢 EXCELENTE'
  if (healthScore < 40) status = '🔴 CRÍTICO'
  else if (healthScore < 60) status = '🟠 PRECISA ATENÇÃO'
  else if (healthScore < 80) status = '🟡 BOM'
  
  return {
    timestamp: new Date().toISOString(),
    overview: {
      totalAchievements,
      activeAchievements,
      totalUsers,
      usersWithAchievements: usersWithAchievements.length,
      engagementRate
    },
    categoryStats,
    topAchievements: topAchievementsWithDetails,
    neverUnlocked: {
      count: neverUnlocked.length,
      rate: Math.round(neverUnlockedRate),
      achievements: neverUnlocked.slice(0, 20) // Limitar para não sobrecarregar resposta
    },
    recentActivity: {
      unlocks: recentUnlocks,
      activeUsers: recentUsers.length
    },
    alerts,
    healthScore: {
      score: healthScore,
      status,
      level: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'warning' : 'critical'
    }
  }
}