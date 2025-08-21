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

    // TODO: Add admin role check
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    const [
      totalActiveListings,
      totalCompletedTransactions,
      totalMarketplaceVolume,
      totalMarketplaceFees,
      averagePrice,
      topSellers,
      recentTransactions
    ] = await Promise.all([
      // Total active listings
      prisma.marketplaceListing.count({
        where: { status: 'ACTIVE' }
      }),

      // Total completed transactions
      prisma.marketplaceTransaction.count({
        where: { status: 'COMPLETED' }
      }),

      // Total marketplace volume
      prisma.marketplaceTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      }),

      // Total marketplace fees
      prisma.marketplaceTransaction.aggregate({
        _sum: { marketplaceFee: true },
        where: { status: 'COMPLETED' }
      }),

      // Average item price
      prisma.marketplaceListing.aggregate({
        _avg: { price: true },
        where: { status: 'ACTIVE' }
      }),

      // Top sellers by volume
      prisma.user.findMany({
        include: {
          _count: {
            select: {
              marketplaceSales: {
                where: { status: 'COMPLETED' }
              }
            }
          },
          marketplaceSales: {
            where: { status: 'COMPLETED' },
            select: { amount: true }
          }
        },
        orderBy: {
          marketplaceSales: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Recent transactions
      prisma.marketplaceTransaction.findMany({
        where: { status: 'COMPLETED' },
        include: {
          buyer: {
            select: { id: true, name: true, email: true }
          },
          seller: {
            select: { id: true, name: true, email: true }
          },
          listing: {
            include: {
              userItem: {
                include: {
                  item: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ])

    // Process top sellers data
    const topSellersByVolume = topSellers
      .map(seller => ({
        userId: seller.id,
        name: seller.name,
        email: seller.email,
        totalSales: seller._count.marketplaceSales,
        totalVolume: seller.marketplaceSales.reduce((sum, tx) => sum + tx.amount, 0)
      }))
      .filter(seller => seller.totalSales > 0)
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10)

    // Process recent transactions
    const processedRecentTransactions = recentTransactions.map(tx => ({
      id: tx.id,
      itemName: tx.listing.userItem.item.name,
      price: tx.amount,
      buyerName: tx.buyer.name || tx.buyer.email,
      sellerName: tx.seller.name || tx.seller.email,
      createdAt: tx.createdAt.toISOString(),
      status: tx.status
    }))

    return NextResponse.json({
      totalActiveListings,
      totalCompletedTransactions,
      totalMarketplaceVolume: totalMarketplaceVolume._sum.amount || 0,
      totalMarketplaceFees: totalMarketplaceFees._sum.marketplaceFee || 0,
      averageItemPrice: Math.round(averagePrice._avg.price || 0),
      topSellersByVolume,
      recentTransactions: processedRecentTransactions
    })
  } catch (error) {
    console.error('Admin marketplace stats error:', error)
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

    const { action, listingId, userId, reason } = await req.json()

    if (action === 'force-cancel-listing') {
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

      // Log admin action
      console.warn(`[ADMIN-ACTION] Listing ${listingId} force-cancelled by admin ${session.user.id}: ${reason}`)

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

    if (action === 'ban-user-from-marketplace') {
      if (!userId || !reason) {
        return NextResponse.json(
          { error: 'userId and reason are required' },
          { status: 400 }
        )
      }

      // Cancel all active listings from user
      await prisma.marketplaceListing.updateMany({
        where: {
          sellerId: userId,
          status: 'ACTIVE'
        },
        data: { status: 'CANCELLED' }
      })

      // Here you would typically add the user to a banned list
      // For now, we'll just log it
      console.warn(`[ADMIN-ACTION] User ${userId} banned from marketplace by admin ${session.user.id}: ${reason}`)

      return NextResponse.json({
        message: 'User banned from marketplace successfully',
        userId,
        reason
      })
    }

    if (action === 'adjust-marketplace-fee') {
      const { feePercentage } = await req.json()
      
      if (!feePercentage || feePercentage < 0 || feePercentage > 50) {
        return NextResponse.json(
          { error: 'Invalid fee percentage (must be 0-50)' },
          { status: 400 }
        )
      }

      // Here you would store the fee in a configuration table
      // For now, we'll just log it
      console.log(`[ADMIN-ACTION] Marketplace fee adjusted to ${feePercentage}% by admin ${session.user.id}`)

      return NextResponse.json({
        message: 'Marketplace fee adjusted successfully',
        feePercentage
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin marketplace action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}