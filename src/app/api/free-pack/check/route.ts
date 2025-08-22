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

    // Check if user has received and claimed their free pack
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hasReceivedFreePack: true }
    })

    if (!user) {
      console.warn(`User with ID ${session.user.id} not found in database`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for any unclaimed free packs
    const unclaimedFreePack = await prisma.freePackGrant.findFirst({
      where: {
        userId: session.user.id,
        claimed: false
      },
      include: {
        pack: true
      }
    })

    return NextResponse.json({
      hasReceivedFreePack: user.hasReceivedFreePack,
      unclaimedFreePack: unclaimedFreePack
    })

  } catch (error) {
    console.error('Free pack check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}