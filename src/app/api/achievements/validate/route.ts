import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { achievementValidatorService } = await import('@/lib/achievement-validator')
    
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
    
    const { action, userId } = await req.json()
    
    switch (action) {
      case 'validate-user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for validate-user action' },
            { status: 400 }
          )
        }
        
        await achievementValidatorService.validateUserAchievements(userId)
        return NextResponse.json({
          message: `User ${userId} achievements validated successfully`
        })
        
      case 'validate-test-users':
      default:
        await achievementValidatorService.validateTestUsersAchievements()
        return NextResponse.json({
          message: 'Test users achievements validated successfully'
        })
    }
    
  } catch (error) {
    console.error('Error in achievement validation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}