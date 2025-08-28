import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { rankingSyncService } = await import('@/lib/ranking-sync')
    
    const session = await getServerSession(authOptions)
    
    // Permitir execução apenas para admins ou em desenvolvimento
    const isAdmin = ['admin@admin.com', 'superadmin@admin.com'].includes(session?.user?.email || '')
    const isDev = process.env.NODE_ENV === 'development'
    
    if (!isAdmin && !isDev) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { action } = await req.json()
    
    switch (action) {
      case 'fix-streaks':
        await rankingSyncService.fixZeroStreaksForActiveUsers()
        return NextResponse.json({
          message: 'Zero streaks fixed successfully'
        })
        
      case 'sync-rankings':
        await rankingSyncService.syncStreakRankings()
        return NextResponse.json({
          message: 'Rankings synchronized successfully'
        })
        
      case 'full-sync':
      default:
        await rankingSyncService.fullSync()
        return NextResponse.json({
          message: 'Full synchronization completed successfully'
        })
    }
    
  } catch (error) {
    console.error('Error in ranking sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}