import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { selectRandomRarity } = await import('@/lib/rarity-system')
    const { userStatsService } = await import('@/lib/user-stats')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { packId } = await req.json()

    if (!packId) {
      return NextResponse.json(
        { error: 'Pack ID is required' },
        { status: 400 }
      )
    }

    // Get pack details with probabilities
    const pack = await prisma.pack.findUnique({
      where: { id: packId, isActive: true },
      include: {
        probabilities: true
      }
    })

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      )
    }

    // Check user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true }
    })

    if (!user || user.credits < pack.price) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      )
    }

    // Select random rarity based on pack probabilities
    const selectedRarity = selectRandomRarity(pack.probabilities)

    // Get random item of selected rarity (usando cache)
    const { getCachedItemsByRarity } = await import('@/lib/rarity-system')
    const itemsByRarity = await getCachedItemsByRarity()
    const allItems = itemsByRarity[selectedRarity]

    // Filter items that are available (not sold out for limited editions)
    const availableItems = allItems.filter(item => {
      if (!item.isLimitedEdition) return true
      if (!item.maxEditions) return true // unlimited limited edition
      return item.currentEditions < item.maxEditions
    })

    if (availableItems.length === 0) {
      return NextResponse.json(
        { error: 'No items available for selected rarity' },
        { status: 500 }
      )
    }

    const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)]

    // Process the pack opening in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits from user
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            decrement: pack.price
          }
        }
      })

      let limitedEditionId = null
      let limitedEditionInfo = null

      // Handle limited edition items
      if (selectedItem.isLimitedEdition) {
        // Update the item's current edition count
        const updatedItem = await tx.item.update({
          where: { id: selectedItem.id },
          data: {
            currentEditions: {
              increment: 1
            }
          }
        })

        // Create the limited edition record
        const limitedEdition = await tx.limitedEdition.create({
          data: {
            itemId: selectedItem.id,
            serialNumber: updatedItem.currentEditions
          }
        })

        limitedEditionId = limitedEdition.id
        limitedEditionInfo = {
          serialNumber: limitedEdition.serialNumber,
          maxEditions: selectedItem.maxEditions,
          mintedAt: limitedEdition.mintedAt
        }
      }

      // Add item to user's inventory
      const userItem = await tx.userItem.create({
        data: {
          userId: session.user.id,
          itemId: selectedItem.id,
          limitedEditionId: limitedEditionId
        }
      })

      // Record pack opening
      await tx.packOpening.create({
        data: {
          userId: session.user.id,
          packId: pack.id,
          itemId: selectedItem.id
        }
      })

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'PACK_PURCHASE',
          amount: -pack.price,
          description: `Opened ${pack.name} - Received ${selectedItem.name}${limitedEditionInfo ? ` #${limitedEditionInfo.serialNumber}` : ''}`
        }
      })

      return {
        item: {
          ...selectedItem,
          limitedEdition: limitedEditionInfo
        },
        newBalance: updatedUser.credits,
        pack: {
          id: pack.id,
          name: pack.name,
          price: pack.price
        }
      }
    })

    // Track achievement progress (outside transaction)
    try {
      await userStatsService.trackPackOpening(
        session.user.id,
        pack.id,
        selectedItem.id,
        selectedItem.rarity
      )

      await userStatsService.trackItemObtained(
        session.user.id,
        selectedItem.id,
        selectedItem.rarity,
        true
      )

    } catch (statsError) {
      console.error('Error tracking achievement progress:', statsError)
      // Don't fail the main transaction
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Pack opening error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}