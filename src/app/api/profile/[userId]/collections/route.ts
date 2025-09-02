import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    // Verificar se o usuário existe e se o profile é público
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        profileVisibility: true
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check privacy settings
    if (targetUser.profileVisibility === 'PRIVATE') {
      return NextResponse.json(
        { error: 'Profile is private' },
        { status: 403 }
      )
    }

    // For FRIENDS_ONLY, check if it's the same user
    if (targetUser.profileVisibility === 'FRIENDS_ONLY') {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id || session.user.id !== params.userId) {
        return NextResponse.json(
          { error: 'Profile is visible to friends only' },
          { status: 403 }
        )
      }
    }

    // Buscar todas as coleções com informações de progresso do usuário
    const collections = await prisma.collection.findMany({
      where: {
        isActive: true
      },
      include: {
        items: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
            value: true
          }
        },
        userCollections: {
          where: { userId: params.userId },
          select: {
            itemsOwned: true,
            completedAt: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Processar dados das coleções
    const processedCollections = await Promise.all(collections.map(async (collection) => {
      const userCollection = collection.userCollections[0]
      const itemsOwned = userCollection?.itemsOwned || 0
      const totalItems = collection.maxItems
      const isCompleted = userCollection?.completedAt !== null
      const completionPercentage = totalItems > 0 ? Math.round((itemsOwned / totalItems) * 100) : 0

      // Buscar itens específicos que o usuário possui desta coleção
      const userItems = await prisma.userItem.findMany({
        where: {
          userId: params.userId,
          item: {
            collectionId: collection.id,
            isActive: true
          }
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              rarity: true,
              value: true
            }
          }
        },
        orderBy: [
          { item: { rarity: 'desc' } },
          { item: { name: 'asc' } }
        ]
      })

      return {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        imageUrl: collection.imageUrl,
        themeId: collection.themeId,
        customTheme: collection.customTheme,
        totalItems: totalItems,
        itemsOwned: itemsOwned,
        completionPercentage: completionPercentage,
        isCompleted: isCompleted,
        completedAt: userCollection?.completedAt,
        availableItems: collection.items.length,
        userOwnedItems: userItems.map(ui => ({
          id: ui.item.id,
          name: ui.item.name,
          imageUrl: ui.item.imageUrl,
          rarity: ui.item.rarity,
          value: ui.item.value,
          obtainedAt: ui.obtainedAt
        }))
      }
    }))

    // Ordenar coleções por: completas primeiro, depois por maior progresso
    const sortedCollections = processedCollections.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return -1
      if (!a.isCompleted && b.isCompleted) return 1
      return b.completionPercentage - a.completionPercentage
    })

    // Estatísticas gerais
    const stats = {
      totalCollections: collections.length,
      completedCollections: sortedCollections.filter(c => c.isCompleted).length,
      collectionsInProgress: sortedCollections.filter(c => c.itemsOwned > 0 && !c.isCompleted).length,
      totalItemsOwned: sortedCollections.reduce((sum, c) => sum + c.itemsOwned, 0),
      totalPossibleItems: sortedCollections.reduce((sum, c) => sum + c.totalItems, 0)
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name
      },
      stats,
      collections: sortedCollections
    })

    // Cache por 5 minutos
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching user collections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}