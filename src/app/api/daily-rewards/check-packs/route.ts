import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for any unclaimed DAILY_REWARD free packs
    const unclaimedDailyPacks = await prisma.freePackGrant.findMany({
      where: {
        userId: session.user.id,
        claimed: false,
        source: "DAILY_REWARD"
      },
      include: {
        pack: {
          include: {
            customType: true
          }
        }
      },
      orderBy: {
        grantedAt: 'desc'
      }
    })

    return NextResponse.json({
      unclaimedDailyPacks
    })

  } catch (error) {
    console.error('Daily reward packs check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}