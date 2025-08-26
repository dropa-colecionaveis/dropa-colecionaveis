import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Rarity, TransactionType } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { selectRandomRarity, getCachedItemsByRarity } from '@/lib/rarity-system'
import { userStatsService } from '@/lib/user-stats'

interface OpenedItem {
  id: string
  name: string
  description: string | null
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

    // Cache all items by rarity ONCE before transaction for maximum performance
    const itemsByRarity = await getCachedItemsByRarity()

    // Process multiple pack openings in a transaction with extended timeout
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

      // Pre-select all items and rarities to minimize DB queries in loop
      const selectedItems = []
      for (let i = 0; i < quantity; i++) {
        const selectedRarity = selectRandomRarity(pack.probabilities)
        const allItems = itemsByRarity[selectedRarity]

        const availableItems = allItems.filter(item => {
          if (!item.isLimitedEdition) return true
          if (!item.maxEditions) return true
          return item.currentEditions < item.maxEditions
        })

        if (availableItems.length === 0) {
          throw new Error(`No items available for rarity ${selectedRarity}`)
        }

        const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)]
        selectedItems.push(selectedItem)
      }

      // Batch process limited edition updates
      const limitedEditionUpdates = []
      const limitedEditionItems = selectedItems.filter(item => item.isLimitedEdition)
      
      if (limitedEditionItems.length > 0) {
        // Group by item ID to batch increments
        const itemIncrements = new Map()
        limitedEditionItems.forEach(item => {
          const current = itemIncrements.get(item.id) || 0
          itemIncrements.set(item.id, current + 1)
        })

        // Batch update all limited edition items
        for (const [itemId, increment] of itemIncrements) {
          limitedEditionUpdates.push(
            tx.item.update({
              where: { id: itemId },
              data: { currentEditions: { increment } }
            })
          )
        }
      }

      const updatedItems = await Promise.all(limitedEditionUpdates)
      const updatedItemsMap = new Map(updatedItems.map(item => [item.id, item]))

      // Process items with updated edition counts
      let limitedEditionCounter = new Map()
      
      for (let i = 0; i < selectedItems.length; i++) {
        const selectedItem = selectedItems[i]
        let limitedEditionId = null
        let limitedEditionInfo = null

        if (selectedItem.isLimitedEdition) {
          const updatedItem = updatedItemsMap.get(selectedItem.id)
          const currentCount = limitedEditionCounter.get(selectedItem.id) || 0
          limitedEditionCounter.set(selectedItem.id, currentCount + 1)
          
          const serialNumber = (updatedItem?.currentEditions || selectedItem.currentEditions) - (limitedEditionItems.filter(item => item.id === selectedItem.id).length - currentCount - 1)

          const limitedEdition = await tx.limitedEdition.create({
            data: {
              itemId: selectedItem.id,
              serialNumber: serialNumber
            }
          })

          limitedEditionId = limitedEdition.id
          limitedEditionInfo = {
            serialNumber: limitedEdition.serialNumber,
            maxEditions: selectedItem.maxEditions || 0,
            mintedAt: limitedEdition.mintedAt
          }
        }

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
          limitedEdition: limitedEditionInfo || undefined
        })
      }

      // Bulk insert all records in parallel
      await Promise.all([
        tx.userItem.createMany({ data: userItemRecords }),
        tx.packOpening.createMany({ data: packOpeningRecords }),
        tx.transaction.createMany({ data: transactionRecords })
      ])

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
    }, {
      maxWait: 60000, // 60 seconds
      timeout: 120000 // 2 minutes
    })

    // Process stats and achievements in background (non-blocking) - same pattern as free packs
    setImmediate(async () => {
      try {
        // Process all stats and achievements in parallel for maximum speed
        const allStatsPromises = result.items.flatMap(item => [
          userStatsService.trackPackOpening(
            session.user.id,
            pack.id,
            item.id,
            item.rarity
          ),
          userStatsService.trackItemObtained(
            session.user.id,
            item.id,
            item.rarity,
            true
          )
        ])

        await Promise.allSettled(allStatsPromises)
      } catch (backgroundError) {
        console.error('Background processing error:', backgroundError)
      }
    })

    return NextResponse.json(result) // ⚡ Immediate response
  } catch (error) {
    console.error('Multiple pack opening error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}