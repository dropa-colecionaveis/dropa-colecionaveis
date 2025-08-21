import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        createdAt: true,
        _count: {
          select: {
            packOpenings: true,
            userItems: true,
          }
        }
      }
    })

    if (!user) {
      console.warn(`User with ID ${session.user.id} not found in database`)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Count rare items
    const rareItemsCount = await prisma.userItem.count({
      where: {
        userId: session.user.id,
        item: {
          rarity: {
            in: ['RARO', 'EPICO', 'LENDARIO']
          }
        }
      }
    })

    return NextResponse.json({
      ...user,
      stats: {
        packOpenings: user._count.packOpenings,
        totalItems: user._count.userItems,
        rareItems: rareItemsCount
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}