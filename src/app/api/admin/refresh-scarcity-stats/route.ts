import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import PackScarcityIntegration from '@/lib/pack-scarcity-integration'

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    console.log('🔄 Admin solicitou refresh das estatísticas de escassez')

    // Forçar refresh das estatísticas
    const stats = await PackScarcityIntegration.getScarcityStats()

    return NextResponse.json({
      success: true,
      message: 'Estatísticas atualizadas com sucesso',
      data: stats,
      refreshedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao atualizar estatísticas de escassez:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}