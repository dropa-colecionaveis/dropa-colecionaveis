import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const activities: RecentActivity[] = []

    // 1. Pack Openings (últimas aberturas de pacotes)
    let packOpenings: any[] = []
    try {
      packOpenings = await prisma.packOpening.findMany({
        where: { userId },
        take: Math.min(limit, 10),
        orderBy: { createdAt: 'desc' },
        include: {
          pack: true
        }
      })
    } catch (error) {
      console.error('Error fetching pack openings:', error)
    }

    // Buscar itens relacionados às aberturas de pacotes
    if (packOpenings.length > 0) {
      try {
        const packOpeningItemIds = packOpenings.map(opening => opening.itemId)
        const packOpeningItems = await prisma.item.findMany({
          where: { id: { in: packOpeningItemIds } },
          include: {
            collection: true
          }
        })

        // Criar um mapa para acesso rápido aos itens
        const itemsMap = new Map(packOpeningItems.map(item => [item.id, item]))

        packOpenings.forEach(opening => {
          const item = itemsMap.get(opening.itemId)
          if (item) {
            activities.push({
              id: `pack_${opening.id}`,
              type: 'PACK_OPENED',
              timestamp: opening.createdAt,
              description: `Abriu um pacote ${opening.pack.name} e recebeu ${item.name}`,
              data: {
                pack: {
                  name: opening.pack.name,
                  type: opening.pack.type
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
      } catch (error) {
        console.error('Error fetching pack opening items:', error)
      }
    }

    // 2. Itens Obtidos Recentemente (excluindo os já capturados por pack opening)
    try {
      const recentItems = await prisma.userItem.findMany({
        where: { 
          userId
          // Removido filtro obtainedAt para evitar problemas
        },
        take: Math.min(limit, 8),
        orderBy: { obtainedAt: 'desc' },
        include: {
          item: {
            include: {
              collection: true
            }
          },
          limitedEdition: true
        }
      })

      // Filtrar itens que não vieram de pack opening recente (últimas 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentPackItems = new Set(
        packOpenings
          .filter(opening => opening.createdAt > oneDayAgo)
          .map(opening => opening.itemId)
      )

      recentItems
        .filter(userItem => !recentPackItems.has(userItem.itemId))
        .forEach(userItem => {
          let description = `Obteve o item ${userItem.item.name}`
          if (userItem.limitedEdition) {
            description += ` (Edição Limitada #${userItem.limitedEdition.serialNumber})`
          }

          activities.push({
            id: `item_${userItem.id}`,
            type: 'ITEM_OBTAINED',
            timestamp: userItem.obtainedAt,
            description,
            data: {
              item: {
                name: userItem.item.name,
                rarity: userItem.item.rarity,
                imageUrl: userItem.item.imageUrl,
                collectionName: userItem.item.collection?.name
              }
            }
          })
        })
    } catch (error) {
      console.error('Error fetching recent items:', error)
    }

    // 3. Transações do Marketplace
    try {
      const marketplaceTransactions = await prisma.marketplaceTransaction.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ],
        status: 'COMPLETED'
      },
      take: Math.min(limit, 10),
      orderBy: { completedAt: 'desc' },
      include: {
        listing: {
          include: {
            userItem: {
              include: {
                item: {
                  include: {
                    collection: true
                  }
                }
              }
            }
          }
        },
        buyer: {
          select: { name: true, email: true }
        },
        seller: {
          select: { name: true, email: true }
        }
      }
    })

      marketplaceTransactions.forEach(transaction => {
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
    } catch (error) {
      console.error('Error fetching marketplace transactions:', error)
    }

    // 4. Conquistas Desbloqueadas
    try {
      const achievements = await prisma.userAchievement.findMany({
      where: { 
        userId,
        isCompleted: true
      },
      take: Math.min(limit, 8),
      orderBy: { unlockedAt: 'desc' },
      include: {
        achievement: true
      }
    })

      achievements.forEach(userAchievement => {
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
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }

    // 5. Coleções Completadas
    try {
      const completedCollections = await prisma.userCollection.findMany({
      where: { 
        userId,
        NOT: {
          completedAt: null
        }
      },
      take: Math.min(limit, 5),
      orderBy: { completedAt: 'desc' },
      include: {
        collection: true
      }
    })

      completedCollections.forEach(userCollection => {
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
    } catch (error) {
      console.error('Error fetching completed collections:', error)
    }

    // 6. Compras de Créditos
    try {
      const creditPurchases = await prisma.transaction.findMany({
      where: { 
        userId,
        type: 'PURCHASE_CREDITS'
      },
      take: Math.min(limit, 5),
      orderBy: { createdAt: 'desc' }
    })

      creditPurchases.forEach(transaction => {
        activities.push({
          id: `credits_${transaction.id}`,
          type: 'CREDITS_PURCHASED',
          timestamp: transaction.createdAt,
          description: `Comprou ${transaction.amount} créditos`,
          data: {
            credits: transaction.amount,
            price: transaction.amount // Assumindo 1:1 por simplicidade
          }
        })
      })
    } catch (error) {
      console.error('Error fetching credit purchases:', error)
    }

    // Ordenar todas as atividades por timestamp (mais recente primeiro)
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)

    return NextResponse.json({
      activities: sortedActivities,
      total: sortedActivities.length,
      hasMore: activities.length > limit
    })

  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}