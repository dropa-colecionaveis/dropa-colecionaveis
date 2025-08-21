import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    achievements: [],
    categories: ['COLLECTOR', 'EXPLORER', 'TRADER', 'MILESTONE', 'SPECIAL']
  })
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Not implemented' 
  }, { status: 501 })
}