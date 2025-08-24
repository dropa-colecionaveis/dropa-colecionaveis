import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { rankingService } = await import('@/lib/rankings')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Forçar atualização do ranking TOTAL_XP para corrigir valores
    console.log('🔄 Forcing TOTAL_XP ranking update with correct calculations...')
    
    // Limpar ranking atual de TOTAL_XP
    const { prisma } = await import('@/lib/prisma')
    await prisma.ranking.deleteMany({
      where: {
        category: 'TOTAL_XP',
        seasonId: null
      }
    })
    
    // Recalcular com valores corretos
    await rankingService.updateRanking('TOTAL_XP')
    
    console.log('✅ TOTAL_XP ranking updated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'TOTAL_XP ranking updated with correct values'
    })
  } catch (error) {
    console.error('Error updating TOTAL_XP ranking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}