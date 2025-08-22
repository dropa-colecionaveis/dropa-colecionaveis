import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
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

    // Get the collection with all items
    const collection = await prisma.collection.findUnique({
      where: {
        id: params.collectionId,
        isActive: true
      },
      include: {
        theme: {
          select: {
            id: true,
            name: true,
            displayName: true,
            emoji: true,
            colorClass: true,
            borderClass: true
          }
        },
        items: {
          orderBy: {
            itemNumber: 'asc'
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

    // Get user's items in this collection
    const userItems = await prisma.userItem.findMany({
      where: {
        userId: session.user.id,
        item: {
          collectionId: params.collectionId
        }
      },
      include: {
        item: true,
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
        }
      }
    })

    // Create a map of user's items
    const userItemIds = new Set(userItems.map(ui => ui.item.id))

    // Calculate progress (using unique items)
    const totalItems = collection.items.length
    const itemsOwned = userItemIds.size
    const progressPercentage = totalItems > 0 ? Math.min(Math.round((itemsOwned / totalItems) * 100), 100) : 0
    const isCompleted = itemsOwned === totalItems && totalItems > 0

    // Get completion date if completed
    let completedAt = null
    if (isCompleted) {
      const userCollection = await prisma.userCollection.findUnique({
        where: {
          userId_collectionId: {
            userId: session.user.id,
            collectionId: params.collectionId
          }
        }
      })
      completedAt = userCollection?.completedAt
    }

    // Calculate rarity breakdown
    const rarityBreakdown = {
      owned: {} as Record<string, number>,
      total: {} as Record<string, number>
    }

    collection.items.forEach(item => {
      const rarity = item.rarity
      rarityBreakdown.total[rarity] = (rarityBreakdown.total[rarity] || 0) + 1
      
      if (userItemIds.has(item.id)) {
        rarityBreakdown.owned[rarity] = (rarityBreakdown.owned[rarity] || 0) + 1
      }
    })

    // Add ownership status to items
    const itemsWithOwnership = collection.items.map(item => {
      const userItem = userItems.find(ui => ui.item.id === item.id)
      return {
        ...item,
        isOwned: userItemIds.has(item.id),
        obtainedAt: userItem?.obtainedAt || null,
        limitedEdition: userItem?.limitedEdition || null
      }
    })

    const result = {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      theme: collection.theme?.name || collection.customTheme || null,
      imageUrl: collection.imageUrl,
      maxItems: collection.maxItems,
      isLimited: collection.isLimited,
      createdAt: collection.createdAt,
      progress: {
        itemsOwned,
        totalItems,
        progressPercentage,
        isCompleted,
        completedAt,
        rarityBreakdown
      },
      items: itemsWithOwnership
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('User collection fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}