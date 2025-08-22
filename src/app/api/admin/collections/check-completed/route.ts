import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { userStatsService } = await import('@/lib/user-stats')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar se é admin (opcional - remover se não houver sistema de admin)
    // if (!session.user.isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Forçar verificação de coleções completadas
    await userStatsService.checkAndMarkCompletedCollections(userId)

    return NextResponse.json({
      message: `Successfully checked completed collections for user ${user.email || user.name || userId}`,
      userId
    })

  } catch (error) {
    console.error('Error checking completed collections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET para listar status de coleções do usuário
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

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || session.user.id

    // Buscar coleções com progresso
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      include: {
        items: true,
        userCollections: {
          where: { userId }
        }
      }
    })

    const collectionsWithProgress = await Promise.all(
      collections.map(async (collection) => {
        const userItemIds = await prisma.userItem.findMany({
          where: {
            userId,
            item: {
              collectionId: collection.id
            }
          },
          distinct: ['itemId'],
          select: { itemId: true }
        })

        const uniqueItemsOwned = userItemIds.length
        const totalItems = collection.items.length
        const isCompleted = uniqueItemsOwned === totalItems && totalItems > 0
        const userCollection = collection.userCollections[0]

        return {
          id: collection.id,
          name: collection.name,
          totalItems,
          uniqueItemsOwned,
          isCompleted,
          isMarkedCompleted: !!userCollection?.completedAt,
          completedAt: userCollection?.completedAt,
          needsUpdate: isCompleted && !userCollection?.completedAt
        }
      })
    )

    return NextResponse.json({
      collections: collectionsWithProgress,
      summary: {
        total: collections.length,
        completed: collectionsWithProgress.filter(c => c.isCompleted).length,
        markedCompleted: collectionsWithProgress.filter(c => c.isMarkedCompleted).length,
        needsUpdate: collectionsWithProgress.filter(c => c.needsUpdate).length
      }
    })

  } catch (error) {
    console.error('Error fetching collection status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}