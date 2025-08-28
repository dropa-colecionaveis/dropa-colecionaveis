import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Cache settings for better performance
export const revalidate = 300 // 5 minutes (global ranking updates less frequently)
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { globalRankingService } = await import('@/lib/global-ranking')

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    // Diferentes ações disponíveis
    switch (action) {
      case 'info':
        // Retornar informações sobre como funciona o ranking global
        const info = globalRankingService.getGlobalRankingInfo()
        return NextResponse.json(info)

      case 'stats':
        // Retornar estatísticas gerais do ranking global
        const stats = await globalRankingService.getGlobalRankingStats()
        return NextResponse.json(stats)

      case 'user-position':
        // Retornar posição específica de um usuário
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for user-position action' },
            { status: 400 }
          )
        }
        
        try {
          const userPosition = await globalRankingService.getUserGlobalPosition(userId)
          if (!userPosition) {
            // Fallback: verificar se usuário tem rankings individuais
            const { prisma } = await import('@/lib/prisma')
            const userRankings = await prisma.ranking.findMany({
              where: { 
                userId,
                user: {
                  role: {
                    notIn: ['ADMIN', 'SUPER_ADMIN']
                  }
                }
              },
              select: {
                category: true,
                position: true
              }
            })
            
            if (userRankings.length > 0) {
              // Usuário tem rankings mas não apareceu no global - retornar posição 0 temporariamente
              console.warn(`User ${userId} has individual rankings but not in global ranking`)
              return NextResponse.json({
                position: 0,
                globalScore: 0,
                globalPercentage: 0,
                categoryBreakdown: [],
                message: 'Rankings being calculated. Please refresh in a moment.',
                hasIndividualRankings: true
              })
            }
            
            return NextResponse.json({
              position: 0,
              globalScore: 0,
              globalPercentage: 0,
              categoryBreakdown: [],
              message: 'User not yet ranked. Play more to appear in rankings!'
            })
          }
          
          return NextResponse.json(userPosition)
        } catch (error) {
          console.error('Error in user-position action:', error)
          return NextResponse.json({
            position: 0,
            globalScore: 0,
            globalPercentage: 0,
            categoryBreakdown: [],
            message: 'Error calculating position. Please try again later.',
            error: true
          })
        }

      default:
        // Retornar ranking global completo
        const rankings = await globalRankingService.getGlobalRanking(limit)
        
        // Se usuário está logado, incluir sua posição
        let userGlobalPosition = null
        const session = await getServerSession(authOptions)
        
        if (session?.user?.id) {
          userGlobalPosition = await globalRankingService.getUserGlobalPosition(session.user.id)
        }

        const response = NextResponse.json({
          rankings,
          userPosition: userGlobalPosition,
          total: rankings.length,
          info: globalRankingService.getGlobalRankingInfo()
        })

        // Set cache headers for better performance
        response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200')
        response.headers.set('Vary', 'Authorization')
        
        return response
    }
  } catch (error) {
    console.error('Error fetching global ranking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}