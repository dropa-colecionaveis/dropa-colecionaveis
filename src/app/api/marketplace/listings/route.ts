import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ListingStatus, TransactionType } from '@prisma/client'
import { antiFraudService } from '@/lib/anti-fraud'
import { marketplaceRulesEngine } from '@/lib/marketplace-rules'
import { userStatsService } from '@/lib/user-stats'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const rarity = searchParams.get('rarity')
    const collection = searchParams.get('collection')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    const skip = (page - 1) * limit

    const where: any = {
      status: ListingStatus.ACTIVE
    }

    if (rarity) {
      where.userItem = {
        item: {
          rarity: rarity
        }
      }
    }

    if (collection) {
      where.userItem = {
        ...where.userItem,
        item: {
          ...where.userItem?.item,
          collectionId: collection
        }
      }
    }

    if (minPrice) {
      where.price = {
        ...where.price,
        gte: parseInt(minPrice)
      }
    }

    if (maxPrice) {
      where.price = {
        ...where.price,
        lte: parseInt(maxPrice)
      }
    }

    if (search) {
      where.userItem = {
        ...where.userItem,
        item: {
          ...where.userItem?.item,
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }
      }
    }

    const listings = await prisma.marketplaceListing.findMany({
      where,
      include: {
        userItem: {
          include: {
            item: {
              include: {
                collection: {
                  select: {
                    id: true,
                    name: true,
                    theme: {
                      select: {
                        name: true,
                        displayName: true,
                        emoji: true
                      }
                    },
                    customTheme: true
                  }
                }
              }
            },
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
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        [sort]: order
      },
      skip,
      take: limit
    })

    const total = await prisma.marketplaceListing.count({ where })

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Marketplace listings fetch error:', error)
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

    const { userItemId, price, description } = await req.json()

    if (!userItemId || !price || price <= 0) {
      return NextResponse.json(
        { error: 'UserItemId and positive price are required' },
        { status: 400 }
      )
    }

    // Verify user owns the item
    const userItem = await prisma.userItem.findFirst({
      where: {
        id: userItemId,
        userId: session.user.id
      },
      include: {
        item: true
      }
    })

    if (!userItem) {
      return NextResponse.json(
        { error: 'Item not found or you do not own this item' },
        { status: 404 }
      )
    }

    // Check if item is already listed
    const existingListing = await prisma.marketplaceListing.findFirst({
      where: {
        userItemId,
        status: ListingStatus.ACTIVE
      }
    })

    if (existingListing) {
      return NextResponse.json(
        { error: 'Item is already listed on marketplace' },
        { status: 400 }
      )
    }

    // MARKETPLACE RULES: Validate listing creation
    const rulesValidation = await marketplaceRulesEngine.validateListingCreation(
      session.user.id, 
      userItemId, 
      price, 
      description
    )
    
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

    const listing = await prisma.marketplaceListing.create({
      data: {
        userItemId,
        sellerId: session.user.id,
        price,
        description
      },
      include: {
        userItem: {
          include: {
            item: {
              include: {
                collection: true
              }
            },
            limitedEdition: true
          }
        }
      }
    })

    // Track achievement progress for listing creation
    try {
      const event = {
        type: 'MARKETPLACE_LISTING_CREATED' as const,
        userId: session.user.id,
        data: { itemId: userItem.item.id, price, listingId: listing.id },
        timestamp: new Date()
      }
      
      // Use achievementEngine directly to track this specific event
      const { achievementEngine } = await import('@/lib/achievements')
      await achievementEngine.checkAchievements(event)
    } catch (statsError) {
      console.error('Error tracking achievement progress:', statsError)
      // Don't fail the main operation
    }

    // Check warnings from marketplace rules
    let message = 'Item listed successfully'
    let warnings: string[] = []
    
    if (rulesValidation.warning) {
      warnings.push(rulesValidation.warning)
    }

    return NextResponse.json({
      listing,
      message,
      warnings: warnings.length > 0 ? warnings : undefined
    })
  } catch (error) {
    console.error('Marketplace listing creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}