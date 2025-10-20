import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'


// GET - Busca histórico de recompensas diárias do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const offset = parseInt(searchParams.get('offset') || '0')

    const userId = session.user.id

    // Buscar histórico de claims
    const claims = await prisma.dailyRewardClaim.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { claimedAt: 'desc' },
      include: {
        reward: {
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
        }
      }
    })

    // Buscar contagem total para paginação
    const totalClaims = await prisma.dailyRewardClaim.count({
      where: { userId }
    })

    // Calcular estatísticas
    const stats = await prisma.dailyRewardClaim.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: {
        streakDay: true
      }
    })

    // Buscar streak atual
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true
      }
    })

    // Estatísticas por tipo de recompensa
    const rewardTypeStats = await prisma.$queryRaw`
      SELECT 
        dr."rewardType",
        COUNT(drc.id)::int as count,
        SUM(CAST(drc."rewardReceived"->>'value' AS INT))::int as totalValue
      FROM "daily_reward_claims" drc
      JOIN "daily_rewards" dr ON dr.id = drc."rewardId"
      WHERE drc."userId" = ${userId}
      GROUP BY dr."rewardType"
      ORDER BY count DESC
    ` as Array<{
      rewardType: string
      count: number
      totalValue: number
    }>

    // Streak por semana nas últimas 4 semanas
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const weeklyActivity = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', "claimedAt") as week,
        COUNT(*)::int as claims
      FROM "daily_reward_claims"
      WHERE "userId" = ${userId} 
        AND "claimedAt" >= ${fourWeeksAgo}
      GROUP BY DATE_TRUNC('week', "claimedAt")
      ORDER BY week DESC
    ` as Array<{
      week: Date
      claims: number
    }>

    return NextResponse.json({
      claims: claims.map(claim => ({
        id: claim.id,
        claimedAt: claim.claimedAt,
        streakDay: claim.streakDay,
        reward: {
          id: claim.reward.id,
          day: claim.reward.day,
          type: claim.reward.rewardType,
          description: claim.reward.description,
          packType: claim.reward.packType
        },
        received: claim.rewardReceived
      })),
      pagination: {
        total: totalClaims,
        limit,
        offset,
        hasMore: (offset + limit) < totalClaims
      },
      statistics: {
        totalClaims: stats._count.id,
        totalStreakDays: stats._sum.streakDay || 0,
        currentStreak: userStats?.currentStreak || 0,
        longestStreak: userStats?.longestStreak || 0,
        averageStreakDay: stats._count.id > 0 ? Math.round((stats._sum.streakDay || 0) / stats._count.id) : 0,
        rewardTypeBreakdown: rewardTypeStats,
        weeklyActivity: weeklyActivity.map(week => ({
          week: week.week.toISOString().split('T')[0],
          claims: week.claims
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching daily rewards history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
