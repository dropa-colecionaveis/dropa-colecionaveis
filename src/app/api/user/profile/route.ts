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
        profileImage: true,
        profileVisibility: true,
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

    // Add no-cache headers for real-time data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
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

    const body = await req.json()
    const { profileVisibility } = body

    // Validate profileVisibility
    if (profileVisibility && !['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'].includes(profileVisibility)) {
      return NextResponse.json(
        { error: 'Invalid profile visibility option' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(profileVisibility && { profileVisibility })
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        profileVisibility: true,
        credits: true,
        createdAt: true
      }
    })

    const response = NextResponse.json({
      success: true,
      user: updatedUser
    })

    // Clear cache after update
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}