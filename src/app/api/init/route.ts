import { NextResponse } from 'next/server'
import AppInitializer from '@/lib/app-initializer'

export async function GET() {
  try {
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
    // Force re-initialization
    AppInitializer.reset()
    await AppInitializer.initialize()
    
    return NextResponse.json({
      initialized: true,
      message: 'Platform re-initialized successfully'
    })
  } catch (error) {
    console.error('Error re-initializing platform:', error)
    return NextResponse.json(
      { error: 'Failed to re-initialize platform' },
      { status: 500 }
    )
  }
}