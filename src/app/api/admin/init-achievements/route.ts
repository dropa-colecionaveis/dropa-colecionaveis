import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const { achievementEngine } = await import('@/lib/achievements')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin only' },
        { status: authResult.statusCode || 403 }
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