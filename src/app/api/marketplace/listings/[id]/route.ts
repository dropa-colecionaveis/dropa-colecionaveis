import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ListingStatus } from '@prisma/client'
import { antiFraudService } from '@/lib/anti-fraud'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { price, description } = await req.json()

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Positive price is required' },
        { status: 400 }
      )
    }

    // Verify user owns the listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: params.id,
        sellerId: session.user.id,
        status: ListingStatus.ACTIVE
      },
      include: {
        userItem: {
          include: {
            item: true
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or you do not own this listing' },
        { status: 404 }
      )
    }

    // ANTI-FRAUD: Validate new price if it changed
    let priceWarnings: string[] = []
    if (price !== listing.price) {
      const priceValidation = await antiFraudService.validatePrice(listing.userItem.item.id, price)
      if (!priceValidation.isValid) {
        return NextResponse.json(
          { 
            error: priceValidation.message,
            suggestedRange: priceValidation.suggestedRange
          },
          { status: 400 }
        )
      }

      // Check for suspicious price changes
      if (priceValidation.isSuspicious) {
        const priceChangePercent = Math.abs((price - listing.price) / listing.price) * 100
        if (priceChangePercent > 200) { // More than 200% change
          return NextResponse.json(
            { 
              error: 'Mudança de preço muito drástica. Entre em contato com o suporte se necessário.',
              currentPrice: listing.price,
              proposedPrice: price
            },
            { status: 400 }
          )
        }
        priceWarnings.push('Nova precificação marcada para análise')
      }
    }

    const updatedListing = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json({
      listing: updatedListing,
      message: 'Listing updated successfully',
      warnings: priceWarnings.length > 0 ? priceWarnings : undefined
    })
  } catch (error) {
    console.error('Marketplace listing update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: params.id,
        sellerId: session.user.id,
        status: ListingStatus.ACTIVE
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or you do not own this listing' },
        { status: 404 }
      )
    }

    await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        status: ListingStatus.CANCELLED
      }
    })

    return NextResponse.json({
      message: 'Listing cancelled successfully'
    })
  } catch (error) {
    console.error('Marketplace listing deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}