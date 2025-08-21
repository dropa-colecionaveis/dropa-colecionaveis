import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { antiFraudService } from '@/lib/anti-fraud'
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

    // TODO: Add admin role check
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Get anti-fraud statistics
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const stats = await Promise.all([
        // Listings created today
        prisma.marketplaceListing.count({
          where: { createdAt: { gte: oneDayAgo } }
        }),
        
        // Transactions completed today
        prisma.marketplaceTransaction.count({
          where: { 
            status: 'COMPLETED',
            createdAt: { gte: oneDayAgo } 
          }
        }),

        // High value transactions (> 1000 credits) this week
        prisma.marketplaceTransaction.count({
          where: {
            amount: { gte: 1000 },
            createdAt: { gte: oneWeekAgo }
          }
        }),

        // Users with high activity (10+ listings or 5+ purchases today)
        prisma.user.findMany({
          where: {
            OR: [
              {
                marketplaceListings: {
                  some: {
                    createdAt: { gte: oneDayAgo }
                  }
                }
              },
              {
                marketplacePurchases: {
                  some: {
                    createdAt: { gte: oneDayAgo }
                  }
                }
              }
            ]
          },
          include: {
            _count: {
              select: {
                marketplaceListings: {
                  where: { createdAt: { gte: oneDayAgo } }
                },
                marketplacePurchases: {
                  where: { createdAt: { gte: oneDayAgo } }
                }
              }
            }
          }
        })
      ])

      const [todayListings, todayTransactions, highValueTransactions, activeUsers] = stats
      
      const suspiciousUsers = activeUsers.filter((user: any) => 
        user._count.marketplaceListings >= 10 || user._count.marketplacePurchases >= 5
      )

      return NextResponse.json({
        period: {
          today: oneDayAgo.toISOString(),
          week: oneWeekAgo.toISOString()
        },
        stats: {
          todayListings,
          todayTransactions,
          highValueTransactions,
          suspiciousUsers: suspiciousUsers.length
        },
        suspiciousUsers: suspiciousUsers.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          listings: user._count.marketplaceListings,
          purchases: user._count.marketplacePurchases
        }))
      })
    }

    if (action === 'price-analysis') {
      const itemId = searchParams.get('itemId')
      if (!itemId) {
        return NextResponse.json(
          { error: 'itemId parameter required' },
          { status: 400 }
        )
      }

      const priceHistory = await antiFraudService.getItemPriceHistory(itemId, 30)
      return NextResponse.json(priceHistory)
    }

    if (action === 'user-activity') {
      const userId = searchParams.get('userId')
      if (!userId) {
        return NextResponse.json(
          { error: 'userId parameter required' },
          { status: 400 }
        )
      }

      const suspiciousActivity = await antiFraudService.detectSuspiciousActivity(userId)
      const listingLimits = await antiFraudService.validateListingLimits(userId)
      
      // Get user's recent activity
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const userActivity = await Promise.all([
        prisma.marketplaceListing.count({
          where: {
            sellerId: userId,
            createdAt: { gte: oneWeekAgo }
          }
        }),
        prisma.marketplaceTransaction.count({
          where: {
            buyerId: userId,
            createdAt: { gte: oneWeekAgo }
          }
        }),
        prisma.marketplaceListing.findMany({
          where: {
            sellerId: userId,
            createdAt: { gte: oneWeekAgo }
          },
          include: {
            userItem: {
              include: { item: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ])

      const [weeklyListings, weeklyPurchases, recentListings] = userActivity

      return NextResponse.json({
        suspiciousActivity,
        listingLimits,
        weeklyActivity: {
          listings: weeklyListings,
          purchases: weeklyPurchases
        },
        recentListings: recentListings.map(listing => ({
          id: listing.id,
          itemName: listing.userItem.item.name,
          price: listing.price,
          itemValue: listing.userItem.item.value,
          priceRatio: Math.round((listing.price / listing.userItem.item.value) * 100),
          createdAt: listing.createdAt,
          status: listing.status
        }))
      })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Anti-fraud admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    const { action, userId, listingId, reason } = await req.json()

    if (action === 'flag-user') {
      if (!userId || !reason) {
        return NextResponse.json(
          { error: 'userId and reason are required' },
          { status: 400 }
        )
      }

      // Log manual flag
      console.warn(`[ADMIN-FLAG] User ${userId} flagged by admin ${session.user.id}: ${reason}`)
      
      // Here you could update a user status or create a flag record
      // await prisma.userFlag.create({
      //   data: { userId, flaggedById: session.user.id, reason, type: 'MANUAL' }
      // })

      return NextResponse.json({
        message: 'User flagged successfully',
        userId,
        reason
      })
    }

    if (action === 'cancel-listing') {
      if (!listingId || !reason) {
        return NextResponse.json(
          { error: 'listingId and reason are required' },
          { status: 400 }
        )
      }

      const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        include: {
          userItem: { include: { item: true } }
        }
      })

      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        )
      }

      await prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { status: 'CANCELLED' }
      })

      console.warn(`[ADMIN-ACTION] Listing ${listingId} cancelled by admin ${session.user.id}: ${reason}`)

      return NextResponse.json({
        message: 'Listing cancelled successfully',
        listing: {
          id: listing.id,
          itemName: listing.userItem.item.name,
          price: listing.price,
          seller: listing.sellerId
        },
        reason
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Anti-fraud admin action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}