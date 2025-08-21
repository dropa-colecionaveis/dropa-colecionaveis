import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session: session,
      hasSession: !!session,
      cookies: req.headers.get('cookie') || 'No cookies',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Session test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      session: null,
      hasSession: false
    })
  }
}