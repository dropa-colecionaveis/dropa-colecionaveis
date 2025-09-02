import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(
  req: Request,
  { params }: { params: { userId: string; collectionId: string } }
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

    // Buscar a coleção específica
    const collection = await prisma.collection.findUnique({
      where: { 
        id: params.collectionId,
        isActive: true
      },
      include: {
        items: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            rarity: true,
            value: true,
            itemNumber: true,
            isLimitedEdition: true,
            maxEditions: true,
            currentEditions: true
          },
          orderBy: [
            { itemNumber: 'asc' },
            { name: 'asc' }
          ]
        },
        userCollections: {
          where: { userId: params.userId },
          select: {
            itemsOwned: true,
            completedAt: true
          }
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Buscar quais itens o usuário possui desta coleção
    const userItems = await prisma.userItem.findMany({
      where: {
        userId: params.userId,
        item: {
          collectionId: params.collectionId,
          isActive: true
        }
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            rarity: true,
            value: true,
            itemNumber: true,
            isLimitedEdition: true,
            maxEditions: true,
            currentEditions: true
          }
        },
        limitedEdition: {
          select: {
            id: true,
            serialNumber: true,
            mintedAt: true
          }
        }
      },
      orderBy: [
        { item: { itemNumber: 'asc' } },
        { item: { name: 'asc' } }
      ]
    })

    // Criar mapa dos itens que o usuário possui
    const userItemsMap = new Map(
      userItems.map(ui => [
        ui.item.id, 
        {
          ...ui.item,
          obtainedAt: ui.obtainedAt,
          limitedEdition: ui.limitedEdition
        }
      ])
    )

    // Processar todos os itens da coleção
    const allItems = collection.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      rarity: item.rarity,
      value: item.value,
      itemNumber: item.itemNumber,
      isLimitedEdition: item.isLimitedEdition,
      maxEditions: item.maxEditions,
      currentEditions: item.currentEditions,
      owned: userItemsMap.has(item.id),
      obtainedAt: userItemsMap.get(item.id)?.obtainedAt,
      limitedEdition: userItemsMap.get(item.id)?.limitedEdition
    }))

    // Estatísticas da coleção
    const userCollection = collection.userCollections[0]
    const itemsOwned = userItems.length // Usar quantidade real de itens que o usuário possui
    const totalItems = collection.maxItems
    const isCompleted = userCollection?.completedAt !== null
    const completionPercentage = totalItems > 0 ? Math.round((itemsOwned / totalItems) * 100) : 0

    // Separar itens por raridade
    const itemsByRarity = {
      COMUM: allItems.filter(item => item.rarity === 'COMUM'),
      INCOMUM: allItems.filter(item => item.rarity === 'INCOMUM'),
      RARO: allItems.filter(item => item.rarity === 'RARO'),
      EPICO: allItems.filter(item => item.rarity === 'EPICO'),
      LENDARIO: allItems.filter(item => item.rarity === 'LENDARIO')
    }

    // Estatísticas por raridade
    const rarityStats = Object.entries(itemsByRarity).map(([rarity, items]) => ({
      rarity,
      total: items.length,
      owned: items.filter(item => item.owned).length,
      percentage: items.length > 0 ? Math.round((items.filter(item => item.owned).length / items.length) * 100) : 0
    })).filter(stat => stat.total > 0)

    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name
      },
      collection: {
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
        isLimited: collection.isLimited,
        isTemporal: collection.isTemporal,
        availableFrom: collection.availableFrom,
        availableUntil: collection.availableUntil
      },
      items: allItems,
      itemsByRarity,
      rarityStats,
      stats: {
        totalPossible: totalItems,
        totalOwned: itemsOwned,
        completionPercentage,
        isCompleted,
        missingItems: totalItems - itemsOwned
      }
    })

    // Cache por 3 minutos (mais dinâmico que lista geral)
    response.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=300')
    
    return response
  } catch (error) {
    console.error('Error fetching collection details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}