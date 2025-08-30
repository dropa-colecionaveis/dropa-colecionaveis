import { NextRequest, NextResponse } from 'next/server'
import { streakResetService } from '@/lib/streak-reset-job'

export async function POST(req: NextRequest) {
  try {
    // Verificar se é uma requisição autorizada (pode ser um cron job ou admin)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-123'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Executar o job de reset de streaks
    await streakResetService.resetInactiveUserStreaks()
    
    return NextResponse.json({
      success: true,
      message: 'Streak reset job completed successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in streak reset API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Permitir GET para teste manual (apenas em desenvolvimento)
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }
  
  try {
    console.log('🧪 Manual streak reset test initiated...')
    await streakResetService.testStreakReset()
    
    return NextResponse.json({
      success: true,
      message: 'Test streak reset completed',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in test streak reset:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}