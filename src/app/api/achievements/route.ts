import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { achievementEngine } from '@/lib/achievements'

// Test with achievementEngine import
export async function GET(req: Request) {
  try {
    // Skip during build time or if essential deps not available
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL || process.env.VERCEL_ENV === 'building') {
      return NextResponse.json({
        achievements: [],
        categories: ['COLLECTOR', 'EXPLORER', 'TRADER', 'MILESTONE', 'SPECIAL']
      })
    }

    const session = await getServerSession(authOptions)
    
    // Test basic prisma query
    const achievementsCount = await prisma.achievement.count({
      where: { isActive: true }
    })
    
    return NextResponse.json({
      achievements: [],
      categories: ['COLLECTOR', 'EXPLORER', 'TRADER', 'MILESTONE', 'SPECIAL'],
      user: session?.user?.id || null,
      count: achievementsCount
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  return NextResponse.json({ 
    error: 'Not available during build' 
  }, { status: 503 })
}