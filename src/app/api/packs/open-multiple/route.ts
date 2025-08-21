import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { selectRandomRarity } from '@/lib/rarity-system'
import { userStatsService } from '@/lib/user-stats'
import { Rarity, TransactionType } from '@prisma/client'

interface OpenedItem {
  id: string
  name: string
  description: string
  rarity: Rarity
  value: number
  imageUrl: string
  limitedEdition?: {
    serialNumber: number
    maxEditions: number
    mintedAt: Date
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

    const { packId, quantity } = await req.json()

    if (!packId || !quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Invalid pack ID or quantity (1-100 allowed)' },
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

    const totalCost = pack.price * quantity

    if (!user || user.credits < totalCost) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${totalCost}, have ${user?.credits || 0}` },
        { status: 400 }
      )
    }

    // Process multiple pack openings in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits from user
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            decrement: totalCost
          }
        }
      })

      const openedItems: OpenedItem[] = []
      const packOpeningRecords = []
      const userItemRecords = []
      const transactionRecords = []

      // Process each pack opening
      for (let i = 0; i < quantity; i++) {
        // Select random rarity based on pack probabilities
        const selectedRarity = selectRandomRarity(pack.probabilities)

        // Get random item of selected rarity
        const allItems = await tx.item.findMany({
          where: {
            rarity: selectedRarity,
            isActive: true
          }
        })

        // Filter items that are available (not sold out for limited editions)
        const availableItems = allItems.filter(item => {
          if (!item.isLimitedEdition) return true
          if (!item.maxEditions) return true // unlimited limited edition
          return item.currentEditions < item.maxEditions
        })

        if (availableItems.length === 0) {
          throw new Error(`No items available for rarity ${selectedRarity}`)
        }

        const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)]

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
            maxEditions: selectedItem.maxEditions || 0,
            mintedAt: limitedEdition.mintedAt
          }
        }

        // Prepare records for bulk insert
        userItemRecords.push({
          userId: session.user.id,
          itemId: selectedItem.id,
          limitedEditionId: limitedEditionId
        })

        packOpeningRecords.push({
          userId: session.user.id,
          packId: pack.id,
          itemId: selectedItem.id
        })

        transactionRecords.push({
          userId: session.user.id,
          type: TransactionType.PACK_PURCHASE,
          amount: -pack.price,
          description: `Opened ${pack.name} #${i + 1} - Received ${selectedItem.name}${limitedEditionInfo ? ` #${limitedEditionInfo.serialNumber}` : ''}`
        })

        openedItems.push({
          ...selectedItem,
          limitedEdition: limitedEditionInfo
        })
      }

      // Bulk insert all records
      await tx.userItem.createMany({
        data: userItemRecords
      })

      await tx.packOpening.createMany({
        data: packOpeningRecords
      })

      await tx.transaction.createMany({
        data: transactionRecords
      })

      // Calculate summary statistics
      const rarityCounts: Record<string, number> = {}
      let totalValue = 0

      openedItems.forEach(item => {
        rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1
        totalValue += item.value
      })

      return {
        items: openedItems,
        newBalance: updatedUser.credits,
        pack: {
          id: pack.id,
          name: pack.name,
          price: pack.price
        },
        summary: {
          totalItems: openedItems.length,
          totalValue,
          rarityCounts
        }
      }
    })

    // Track achievement progress (outside transaction)
    try {
      // Use optimized bulk tracking functions
      await userStatsService.trackMultiplePackOpenings(
        session.user.id,
        pack.id,
        result.items.map(item => ({ id: item.id, rarity: item.rarity as Rarity }))
      )

      await userStatsService.trackMultipleItemsObtained(
        session.user.id,
        result.items.map(item => ({ id: item.id, rarity: item.rarity as Rarity })),
        true
      )

    } catch (statsError) {
      console.error('Error tracking achievement progress:', statsError)
      // Don't fail the main transaction
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Multiple pack opening error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}