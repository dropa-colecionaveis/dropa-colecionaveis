import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const AppInitializer = (await import('@/lib/app-initializer')).default
    
    if (!AppInitializer.isInitialized()) {
      await AppInitializer.initialize()
    }
    
    return NextResponse.json({
      initialized: true,
      message: 'Platform initialized successfully'
    })
  } catch (error) {
    console.error('Error initializing platform:', error)
    return NextResponse.json(
      { error: 'Failed to initialize platform' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const AppInitializer = (await import('@/lib/app-initializer')).default
    
    // Force re-initialization
    AppInitializer.reset()
    await AppInitializer.initialize()
    
    // Initialize stats monitoring system
    console.log('🔍 Initializing stats monitoring system...')
    try {
      const { statsMonitor } = await import('@/lib/stats-monitor')
      const { statsAuditLogger } = await import('@/lib/stats-audit-logger')
      
      // Initialize audit logging table
      await statsAuditLogger.initializeAuditTable()
      
      // Start automatic monitoring (every 30 minutes)
      statsMonitor.startMonitoring(30)
      
      console.log('✅ Stats monitoring system initialized successfully')
    } catch (monitoringError) {
      console.error('⚠️ Failed to initialize stats monitoring (non-critical):', monitoringError)
    }
    
    return NextResponse.json({
      initialized: true,
      message: 'Platform re-initialized successfully',
      statsMonitoring: {
        enabled: true,
        intervalMinutes: 30
      }
    })
  } catch (error) {
    console.error('Error re-initializing platform:', error)
    return NextResponse.json(
      { error: 'Failed to re-initialize platform' },
      { status: 500 }
    )
  }
}