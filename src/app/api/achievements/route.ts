import { NextResponse } from 'next/server'

// Simplified version for build compatibility
export async function GET(req: Request) {
  return NextResponse.json({
    achievements: [],
    categories: ['COLLECTOR', 'EXPLORER', 'TRADER', 'MILESTONE', 'SPECIAL']
  })
}

export async function POST(req: Request) {
  return NextResponse.json({ 
    error: 'Not available during build' 
  }, { status: 503 })
}