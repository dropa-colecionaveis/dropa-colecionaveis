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

    // Get all active collections
    const collections = await prisma.collection.findMany({
      where: {
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
          select: {
            id: true,
            name: true,
            rarity: true,
            value: true,
            imageUrl: true,
            itemNumber: true
          },
          orderBy: {
            itemNumber: 'asc'
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: [
        { isLimited: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Get user's items grouped by collection
    const userItems = await prisma.userItem.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        item: {
          select: {
            id: true,
            collectionId: true,
            itemNumber: true,
            name: true,
            rarity: true,
            value: true,
            imageUrl: true
          }
        }
      }
    })

    // Create a map of user's unique items by collection
    const userItemsByCollection = userItems.reduce((acc, userItem) => {
      const collectionId = userItem.item.collectionId
      if (collectionId) {
        if (!acc[collectionId]) {
          acc[collectionId] = new Set()
        }
        acc[collectionId].add(userItem.item.id)
      }
      return acc
    }, {} as Record<string, Set<string>>)

    // Calculate progress for each collection
    const collectionsWithProgress = collections.map(collection => {
      const userItemsInCollection = userItemsByCollection[collection.id] || new Set()
      const totalItems = collection._count.items
      const itemsOwned = userItemsInCollection.size
      const progressPercentage = totalItems > 0 ? Math.min(Math.round((itemsOwned / totalItems) * 100), 100) : 0
      const isCompleted = itemsOwned === totalItems && totalItems > 0

      return {
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
          isCompleted
        },
        items: collection.items.map(item => ({
          ...item,
          isOwned: userItemsInCollection.has(item.id)
        }))
      }
    })

    return NextResponse.json(collectionsWithProgress)
  } catch (error) {
    console.error('User collections fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}