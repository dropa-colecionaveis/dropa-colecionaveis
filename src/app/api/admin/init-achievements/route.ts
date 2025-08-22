import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { achievementEngine } = await import('@/lib/achievements')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    // Initialize achievements in database
    await achievementEngine.initializeAchievements()

    return NextResponse.json({
      message: 'Achievements initialized successfully',
      success: true
    })
  } catch (error) {
    console.error('Error initializing achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}