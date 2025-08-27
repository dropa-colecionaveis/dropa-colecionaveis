import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
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

    // Optimized single query with rare items count
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
        },
        userItems: {
          where: {
            item: {
              rarity: {
                in: ['RARO', 'EPICO', 'LENDARIO']
              }
            }
          },
          select: { id: true }
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

    const response = NextResponse.json({
      ...user,
      stats: {
        packOpenings: user._count.packOpenings,
        totalItems: user._count.userItems,
        rareItems: user.userItems.length
      }
    })

    // Add aggressive caching headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    response.headers.set('CDN-Cache-Control', 'public, max-age=600')
    
    return response
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}