import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Buscar todos os dados necessários em paralelo
    const [user, userStats, freePackCheck] = await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          role: true,
          emailVerified: true,
          hasReceivedFreePack: true,
          createdAt: true
        }
      }),
      
      // User stats
      prisma.userStats.findUnique({
        where: { userId: session.user.id }
      }),
      
      // Free pack check
      prisma.freePackGrant.findFirst({
        where: {
          userId: session.user.id,
          claimed: false
        },
        include: {
          pack: true
        }
      })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Se user stats não existe, criar default
    const finalUserStats = userStats || {
      totalXP: 0,
      level: 1,
      totalPacksOpened: 0,
      totalCreditsSpent: 0,
      totalItemsCollected: 0,
      collectionsCompleted: 0,
      marketplaceSales: 0,
      marketplacePurchases: 0,
      rareItemsFound: 0,
      epicItemsFound: 0,
      legendaryItemsFound: 0,
      currentStreak: 0,
      longestStreak: 0
    }

    return NextResponse.json({
      user,
      stats: finalUserStats,
      freePack: freePackCheck ? {
        available: true,
        grant: freePackCheck
      } : {
        available: false
      }
    })
    
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}