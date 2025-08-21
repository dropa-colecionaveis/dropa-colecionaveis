import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ListingStatus, TransactionStatus, TransactionType } from '@prisma/client'
import { antiFraudService } from '@/lib/anti-fraud'
import { marketplaceRulesEngine } from '@/lib/marketplace-rules'
import { userStatsService } from '@/lib/user-stats'

export async function POST(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const buyerId = session.user.id

    // Get the listing with all necessary data
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: params.listingId,
        status: ListingStatus.ACTIVE
      },
      include: {
        userItem: {
          include: {
            item: true,
            limitedEdition: true
          }
        },
        seller: true
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or no longer available' },
        { status: 404 }
      )
    }

    // MARKETPLACE RULES: Validate purchase
    const rulesValidation = await marketplaceRulesEngine.validatePurchase(buyerId, params.listingId)
    
    if (!rulesValidation.allowed) {
      return NextResponse.json(
        { 
          error: rulesValidation.message,
          warning: rulesValidation.warning,
          blockDuration: rulesValidation.blockDuration,
          metadata: rulesValidation.metadata
        },
        { status: rulesValidation.blockDuration ? 429 : 400 }
      )
    }

    // Calculate marketplace fee (5%)
    const marketplaceFeeRate = 0.05
    const marketplaceFee = Math.floor(listing.price * marketplaceFeeRate)
    const sellerAmount = listing.price - marketplaceFee

    // Prepare warnings if any
    let warnings: string[] = []
    if (rulesValidation.warning) {
      warnings.push(rulesValidation.warning)
    }
    if (rulesValidation.requiresReview) {
      warnings.push('Esta transação será revisada por segurança')
    }

    // Execute transaction atomically
    const result = await prisma.$transaction(async (prisma) => {
      // Create marketplace transaction
      const marketplaceTransaction = await prisma.marketplaceTransaction.create({
        data: {
          listingId: listing.id,
          buyerId,
          sellerId: listing.sellerId,
          amount: listing.price,
          marketplaceFee,
          status: TransactionStatus.COMPLETED,
          completedAt: new Date()
        }
      })

      // Update buyer credits (deduct purchase amount)
      await prisma.user.update({
        where: { id: buyerId },
        data: {
          credits: {
            decrement: listing.price
          }
        }
      })

      // Update seller credits (add seller amount)
      await prisma.user.update({
        where: { id: listing.sellerId },
        data: {
          credits: {
            increment: sellerAmount
          }
        }
      })

      // Transfer item ownership
      await prisma.userItem.update({
        where: { id: listing.userItemId },
        data: {
          userId: buyerId,
          obtainedAt: new Date()
        }
      })

      // Mark listing as sold
      await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          status: ListingStatus.SOLD
        }
      })

      // Create transaction records for buyer
      await prisma.transaction.create({
        data: {
          userId: buyerId,
          type: TransactionType.MARKETPLACE_PURCHASE,
          amount: -listing.price,
          description: `Purchased ${listing.userItem.item.name} from marketplace`,
          marketplaceTransactionId: marketplaceTransaction.id
        }
      })

      // Create transaction records for seller
      await prisma.transaction.create({
        data: {
          userId: listing.sellerId,
          type: TransactionType.MARKETPLACE_SALE,
          amount: sellerAmount,
          description: `Sold ${listing.userItem.item.name} on marketplace`,
          marketplaceTransactionId: marketplaceTransaction.id
        }
      })

      // Create transaction record for marketplace fee
      if (marketplaceFee > 0) {
        await prisma.transaction.create({
          data: {
            userId: listing.sellerId,
            type: TransactionType.MARKETPLACE_FEE,
            amount: -marketplaceFee,
            description: `Marketplace fee for selling ${listing.userItem.item.name}`,
            marketplaceTransactionId: marketplaceTransaction.id
          }
        })
      }

      return marketplaceTransaction
    })

    // Track achievement progress for both buyer and seller (outside transaction)
    try {
      // Track marketplace purchase for buyer
      await userStatsService.trackMarketplacePurchase(
        buyerId,
        listing.userItem.item.id,
        listing.price
      )
      
      // Track marketplace sale for seller
      await userStatsService.trackMarketplaceSale(
        listing.sellerId,
        listing.userItem.item.id,
        listing.price
      )
    } catch (statsError) {
      console.error('Error tracking achievement progress:', statsError)
      // Don't fail the main transaction
    }

    return NextResponse.json({
      transaction: result,
      message: 'Item purchased successfully',
      details: {
        itemName: listing.userItem.item.name,
        price: listing.price,
        marketplaceFee,
        sellerReceived: sellerAmount
      },
      warnings: warnings.length > 0 ? warnings : undefined
    })
  } catch (error) {
    console.error('Marketplace purchase error:', error)
    
    // If it's a known Prisma error, provide more specific feedback
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Transaction conflict, please try again' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}