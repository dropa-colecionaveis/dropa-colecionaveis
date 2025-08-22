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

    const userItems = await prisma.userItem.findMany({
      where: { userId: session.user.id },
      include: {
        item: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                theme: {
                  select: {
                    name: true,
                    displayName: true,
                    emoji: true
                  }
                },
                customTheme: true
              }
            }
          }
        },
        limitedEdition: {
          select: {
            id: true,
            serialNumber: true,
            mintedAt: true,
            item: {
              select: {
                maxEditions: true,
                currentEditions: true
              }
            }
          }
        },
        marketplaceListings: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            price: true,
            description: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        obtainedAt: 'desc'
      }
    })

    return NextResponse.json({
      items: userItems
    })
  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}