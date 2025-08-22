import { NextResponse } from 'next/server'
import { RankingCategory } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const { rankingService } = await import('@/lib/rankings')

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') as RankingCategory || 'TOTAL_XP'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const seasonId = searchParams.get('seasonId')
    const action = searchParams.get('action')

    if (action === 'stats') {
      const stats = await rankingService.getRankingStats()
      return NextResponse.json(stats)
    }

    if (action === 'top') {
      const topLimit = parseInt(searchParams.get('topLimit') || '10')
      const topPlayers = await rankingService.getTopPlayers(category, topLimit, seasonId || undefined)
      
      return NextResponse.json({
        category,
        topPlayers,
        season: seasonId ? await rankingService.getActiveSeason() : null
      })
    }

    // Leaderboard paginado
    const leaderboard = await rankingService.getLeaderboard(
      category,
      page,
      limit,
      seasonId || undefined
    )

    const activeSeason = await rankingService.getActiveSeason()

    return NextResponse.json({
      ...leaderboard,
      category,
      season: activeSeason,
      categories: [
        { key: 'TOTAL_XP', name: 'Total XP', icon: '⭐' },
        { key: 'PACK_OPENER', name: 'Abridor de Pacotes', icon: '📦' },
        { key: 'COLLECTOR', name: 'Colecionador', icon: '🏆' },
        { key: 'TRADER', name: 'Comerciante', icon: '💰' },
        { key: 'WEEKLY_ACTIVE', name: 'Ativo Semanal', icon: '🔥' },
        { key: 'MONTHLY_ACTIVE', name: 'Ativo Mensal', icon: '📅' }
      ]
    })
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Endpoint para atualizar rankings manualmente (admin)
    const { action, category, seasonId } = await req.json()

    if (action === 'update') {
      if (category) {
        await rankingService.updateRanking(category as RankingCategory, seasonId)
      } else {
        await rankingService.updateAllRankings()
      }

      return NextResponse.json({
        message: 'Rankings updated successfully'
      })
    }

    if (action === 'create-season') {
      const { name, startDate, endDate, rewards } = await req.json()
      
      const seasonId = await rankingService.createSeason(
        name,
        new Date(startDate),
        new Date(endDate),
        rewards
      )

      return NextResponse.json({
        message: 'Season created successfully',
        seasonId
      })
    }

    if (action === 'end-season') {
      await rankingService.endCurrentSeason()
      
      return NextResponse.json({
        message: 'Current season ended successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in rankings POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}