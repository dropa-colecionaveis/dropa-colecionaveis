import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { achievementEngine } = await import('@/lib/achievements')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const completed = searchParams.get('completed')
    const category = searchParams.get('category')
    
    // Obter todas as conquistas disponíveis no sistema
    const allAchievements = await achievementEngine.getAllAchievements()
    
    // Obter conquistas do usuário (apenas as que ele já iniciou/completou)
    const userAchievements = await achievementEngine.getUserAchievements(session.user.id)
    
    // Calcular progresso global de cada conquista (quantos % dos jogadores completaram)
    const { prisma } = await import('@/lib/prisma')
    const totalUsers = await prisma.user.count()
    
    const achievementGlobalStats = await Promise.all(
      allAchievements.map(async (achievement) => {
        const completedCount = await prisma.userAchievement.count({
          where: {
            achievementId: achievement.id,
            isCompleted: true
          }
        })
        
        const globalCompletionRate = totalUsers > 0 
          ? Math.round((completedCount / totalUsers) * 100)
          : 0
          
        return {
          achievementId: achievement.id,
          globalCompletionRate,
          completedCount,
          totalUsers
        }
      })
    )
    
    // Criar mapa para lookup rápido
    const globalStatsMap = new Map(
      achievementGlobalStats.map(stat => [stat.achievementId, stat])
    )
    
    // Criar mapa para facilitar lookup
    const userAchievementMap = new Map(
      userAchievements.map(ua => [ua.achievement.id, ua])
    )
    
    // Combinar todas as conquistas com o progresso do usuário e global
    const combinedAchievements = allAchievements.map(achievement => {
      const userProgress = userAchievementMap.get(achievement.id)
      const globalStats = globalStatsMap.get(achievement.id)
      
      return {
        achievement: {
          ...achievement,
          globalCompletionRate: globalStats?.globalCompletionRate || 0,
          globalCompletedCount: globalStats?.completedCount || 0,
          globalTotalUsers: globalStats?.totalUsers || 0
        },
        progress: userProgress?.progress || 0,
        isCompleted: userProgress?.isCompleted || false,
        unlockedAt: userProgress?.unlockedAt || null
      }
    })
    
    let filteredAchievements = combinedAchievements
    
    // Filtrar por status
    if (completed === 'true') {
      filteredAchievements = combinedAchievements.filter(ua => ua.isCompleted)
    } else if (completed === 'false') {
      filteredAchievements = combinedAchievements.filter(ua => !ua.isCompleted)
    }
    
    // Filtrar por categoria
    if (category) {
      filteredAchievements = filteredAchievements.filter(
        ua => ua.achievement.category === category
      )
    }

    // Calcular estatísticas baseadas no total REAL de conquistas disponíveis
    const totalAchievements = allAchievements.length // Total real de conquistas no sistema
    const completedAchievements = combinedAchievements.filter(ua => ua.isCompleted).length
    
    // Calcular XP apenas das conquistas (método correto)
    const totalPoints = combinedAchievements
      .filter(ua => ua.isCompleted)
      .reduce((sum, ua) => sum + ua.achievement.points, 0)
    
    // Debug: Log para verificar os números
    console.log(`[DEBUG] Total achievements in system: ${totalAchievements}`)
    console.log(`[DEBUG] Completed achievements: ${completedAchievements}`)
    console.log(`[DEBUG] Calculation: ${completedAchievements} / ${totalAchievements} = ${Math.round((completedAchievements / Math.max(1, totalAchievements)) * 100)}%`)

    const recentUnlocks = userAchievements
      .filter(ua => ua.isCompleted && ua.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 5)

    return NextResponse.json({
      achievements: filteredAchievements,
      stats: {
        total: totalAchievements,
        completed: completedAchievements,
        completionRate: Math.round((completedAchievements / Math.max(1, totalAchievements)) * 100),
        totalPoints,
        recentUnlocks
      }
    })
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}