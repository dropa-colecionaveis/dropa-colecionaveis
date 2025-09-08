import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export interface RecentActivity {
  id: string
  type: 'PACK_OPENED' | 'ITEM_OBTAINED' | 'MARKETPLACE_SALE' | 'MARKETPLACE_PURCHASE' | 'ACHIEVEMENT_UNLOCKED' | 'COLLECTION_COMPLETED' | 'CREDITS_PURCHASED'
  timestamp: Date
  description: string
  data: {
    item?: { name: string, rarity: string, imageUrl: string | null, collectionName?: string }
    pack?: { name: string, type: string }
    achievement?: { name: string, icon: string, points: number }
    collection?: { name: string }
    price?: number
    amount?: number
    credits?: number
  }
}

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { getActivityCache, setActivityCache, cleanExpiredCache } = await import('@/lib/activity-cache')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = session.user.id

    // 🚀 CACHE CHECK: Return cached result if available
    const cacheKey = `activities_${userId}_${limit}`
    const now = Date.now()
    const cached = getActivityCache(cacheKey, now)
    
    if (cached) {
      const response = NextResponse.json({ ...cached, cached: true })
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    const activities: RecentActivity[] = []

    // 🚀 OPTIMIZATION 1: Optimized pack openings with pack data
    const packOpenings = await prisma.packOpening.findMany({
      where: { userId },
      take: Math.min(limit, 15),
      orderBy: { createdAt: 'desc' },
      include: {
        pack: {
          select: { 
            name: true, 
            type: true, 
            customType: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Get item details for pack openings in a separate optimized query
    const itemIds = packOpenings.map(opening => opening.itemId).filter(Boolean)
    const items = itemIds.length > 0 ? await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        name: true,
        rarity: true,
        imageUrl: true,
        collection: { select: { name: true } }
      }
    }) : []
    
    // Create a map for quick item lookup
    const itemMap = new Map(items.map(item => [item.id, item]))

    // Process pack openings (now O(1) complexity)
    packOpenings.forEach(opening => {
      const item = itemMap.get(opening.itemId)
      if (item) {
        activities.push({
          id: `pack_${opening.id}`,
          type: 'PACK_OPENED',
          timestamp: opening.createdAt,
          description: `Abriu um pacote ${opening.pack.name} e recebeu ${item.name}`,
          data: {
            pack: {
              name: opening.pack.name,
              type: opening.pack.customType ? opening.pack.customType.name : opening.pack.type || 'UNKNOWN'
            },
            item: {
              name: item.name,
              rarity: item.rarity,
              imageUrl: item.imageUrl,
              collectionName: item.collection?.name
            }
          }
        })
      }
    })

    // 🚀 OPTIMIZATION 2: Parallel execution for independent queries
    const [
      marketplaceTransactionsResult, 
      achievementsResult,
      completedCollectionsResult,
      creditPurchasesResult
    ] = await Promise.allSettled([
      // 1. Marketplace Transactions (optimized with selective includes)
      prisma.marketplaceTransaction.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ],
          status: 'COMPLETED'
        },
        take: Math.min(limit, 10),
        orderBy: { completedAt: 'desc' },
        select: {
          id: true,
          amount: true,
          sellerId: true,
          buyerId: true,
          completedAt: true,
          createdAt: true,
          listing: {
            select: {
              userItem: {
                select: {
                  item: {
                    select: {
                      name: true,
                      rarity: true,
                      imageUrl: true,
                      collection: { select: { name: true } }
                    }
                  }
                }
              }
            }
          },
          buyer: { select: { name: true, email: true } },
          seller: { select: { name: true, email: true } }
        }
      }),

      // 2. Achievements (optimized select)
      prisma.userAchievement.findMany({
        where: { 
          userId,
          isCompleted: true
        },
        take: Math.min(limit, 8),
        orderBy: { unlockedAt: 'desc' },
        select: {
          id: true,
          unlockedAt: true,
          achievement: {
            select: {
              name: true,
              icon: true,
              points: true
            }
          }
        }
      }),

      // 3. Completed Collections (optimized select)
      prisma.userCollection.findMany({
        where: { 
          userId,
          NOT: { completedAt: null }
        },
        take: Math.min(limit, 5),
        orderBy: { completedAt: 'desc' },
        select: {
          id: true,
          completedAt: true,
          collection: {
            select: { name: true }
          }
        }
      }),

      // 4. Credit Purchases (optimized select)
      prisma.transaction.findMany({
        where: { 
          userId,
          type: 'PURCHASE_CREDITS'
        },
        take: Math.min(limit, 5),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          createdAt: true
        }
      })
    ])

    // 🚀 Pack openings already processed above (eliminated N+1 query)

    // Process marketplace transactions
    if (marketplaceTransactionsResult.status === 'fulfilled') {
      marketplaceTransactionsResult.value.forEach(transaction => {
        const isSeller = transaction.sellerId === userId
        const otherUser = isSeller ? transaction.buyer : transaction.seller
        const otherUserName = otherUser?.name || otherUser?.email || 'Usuário'
        const item = transaction.listing.userItem.item

        activities.push({
          id: `marketplace_${transaction.id}`,
          type: isSeller ? 'MARKETPLACE_SALE' : 'MARKETPLACE_PURCHASE',
          timestamp: transaction.completedAt || transaction.createdAt,
          description: isSeller 
            ? `Vendeu ${item.name} para ${otherUserName} por ${transaction.amount} créditos`
            : `Comprou ${item.name} de ${otherUserName} por ${transaction.amount} créditos`,
          data: {
            item: {
              name: item.name,
              rarity: item.rarity,
              imageUrl: item.imageUrl,
              collectionName: item.collection?.name
            },
            price: transaction.amount
          }
        })
      })
    }

    // Process achievements
    if (achievementsResult.status === 'fulfilled') {
      achievementsResult.value.forEach(userAchievement => {
        if (userAchievement.unlockedAt) {
          activities.push({
            id: `achievement_${userAchievement.id}`,
            type: 'ACHIEVEMENT_UNLOCKED',
            timestamp: userAchievement.unlockedAt,
            description: `Desbloqueou a conquista "${userAchievement.achievement.name}"`,
            data: {
              achievement: {
                name: userAchievement.achievement.name,
                icon: userAchievement.achievement.icon,
                points: userAchievement.achievement.points
              }
            }
          })
        }
      })
    }

    // Process completed collections
    if (completedCollectionsResult.status === 'fulfilled') {
      completedCollectionsResult.value.forEach(userCollection => {
        if (userCollection.completedAt) {
          activities.push({
            id: `collection_${userCollection.id}`,
            type: 'COLLECTION_COMPLETED',
            timestamp: userCollection.completedAt,
            description: `Completou a coleção "${userCollection.collection.name}"`,
            data: {
              collection: {
                name: userCollection.collection.name
              }
            }
          })
        }
      })
    }

    // Process credit purchases
    if (creditPurchasesResult.status === 'fulfilled') {
      creditPurchasesResult.value.forEach(transaction => {
        activities.push({
          id: `credits_${transaction.id}`,
          type: 'CREDITS_PURCHASED',
          timestamp: transaction.createdAt,
          description: `Comprou ${transaction.amount} créditos`,
          data: {
            credits: transaction.amount,
            price: transaction.amount
          }
        })
      })
    }

    // Ordenar todas as atividades por timestamp (mais recente primeiro)
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)

    const result = {
      activities: sortedActivities,
      total: sortedActivities.length,
      hasMore: activities.length > limit,
      cached: false
    }

    // 🚀 CACHE: Store result for faster subsequent requests
    setActivityCache(cacheKey, result, now)

    // Clean old cache entries periodically
    cleanExpiredCache(now)

    const response = NextResponse.json(result)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'private, max-age=180') // 3 minutes browser cache
    
    return response

  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}