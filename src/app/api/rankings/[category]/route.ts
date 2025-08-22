import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { rankingService } from '@/lib/rankings'
import { RankingCategory } from '@prisma/client'

export async function GET(
  req: Request,
  { params }: { params: { category: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const category = params.category.toUpperCase() as RankingCategory
    const limit = parseInt(searchParams.get('limit') || '100')
    const seasonId = searchParams.get('seasonId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    // Validar categoria
    const validCategories = ['TOTAL_XP', 'PACK_OPENER', 'COLLECTOR', 'TRADER', 'WEEKLY_ACTIVE', 'MONTHLY_ACTIVE']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid ranking category' },
        { status: 400 }
      )
    }

    if (action === 'around-user' && userId) {
      // Ranking ao redor de um usuário específico
      const range = parseInt(searchParams.get('range') || '5')
      const rankings = await rankingService.getRankingAroundUser(
        userId,
        category,
        range,
        seasonId || undefined
      )

      return NextResponse.json({
        category,
        rankings,
        userId,
        range
      })
    }

    if (action === 'user-position' && userId) {
      // Posição específica do usuário
      const position = await rankingService.getUserPosition(
        userId,
        category,
        seasonId || undefined
      )

      return NextResponse.json({
        category,
        userId,
        position,
        seasonId
      })
    }

    // Ranking completo da categoria
    const rankings = await rankingService.getRanking(
      category,
      limit,
      seasonId || undefined
    )

    // Se usuário está logado, incluir sua posição
    let userPosition = null
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    
    if (session?.user?.id) {
      userPosition = await rankingService.getUserPosition(
        session.user.id,
        category,
        seasonId || undefined
      )
    }

    return NextResponse.json({
      category,
      rankings,
      userPosition,
      total: rankings.length,
      season: seasonId ? await rankingService.getActiveSeason() : null
    })
  } catch (error) {
    console.error(`Error fetching ranking for category ${params.category}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}