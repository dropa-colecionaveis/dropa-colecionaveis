import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { selectRandomRarity, getCachedItemsByRarity } from '@/lib/rarity-system'
import { userStatsService } from '@/lib/user-stats'
import PackScarcityIntegration, { AvailableItem } from '@/lib/pack-scarcity-integration'

export async function POST(req: Request) {
  try {
    
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

    // Get pack details with probabilities and custom type
    const pack = await prisma.pack.findUnique({
      where: { id: packId, isActive: true },
      include: {
        probabilities: true,
        customType: true
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

    // Get effective pack type (custom type name or legacy enum)
    const effectivePackType = pack.customType ? pack.customType.name : pack.type || 'UNKNOWN'

    // Usar o novo sistema de escassez para obter itens disponíveis
    let availableItems: AvailableItem[] = []
    
    try {
      availableItems = await PackScarcityIntegration.getAvailableItemsForPack({
        packId: pack.id,
        userId: session.user.id,
        packType: effectivePackType,
        timestamp: new Date()
      })
    } catch (scarcityError) {
      console.error('Scarcity system error:', scarcityError)
    }

    // Fallback para sistema tradicional se não houver itens disponíveis
    if (availableItems.length === 0) {
      console.log('No items from scarcity system, using traditional fallback')
      
      // Usar sistema tradicional baseado em cache
      const itemsByRarity = await getCachedItemsByRarity()
      const allAvailableItems = Object.values(itemsByRarity).flat()
      
      if (allAvailableItems.length === 0) {
        return NextResponse.json(
          { error: 'No items available at this time. Try again later!' },
          { status: 500 }
        )
      }
      
      // Converter para formato esperado pelo sistema de escassez
      availableItems = allAvailableItems.map(item => ({
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        scarcityLevel: item.scarcityLevel || 'COMMON',
        isUnique: item.isUnique || false,
        isLimitedEdition: item.isLimitedEdition || false,
        isTemporal: item.isTemporal || false,
        availabilityScore: 100,
        collectionId: item.collectionId
      }))
    }

    // Select random rarity based on pack probabilities
    const selectedRarity = selectRandomRarity(pack.probabilities)

    // Filter available items by selected rarity
    const itemsOfSelectedRarity = availableItems.filter(item => item.rarity === selectedRarity)

    if (itemsOfSelectedRarity.length === 0) {
      // Fallback to any available item if none of selected rarity
      const fallbackItem = availableItems[Math.floor(Math.random() * availableItems.length)]
      console.log(`No items of rarity ${selectedRarity} available, using fallback item`)
    }

    const selectedItemData = itemsOfSelectedRarity.length > 0 
      ? itemsOfSelectedRarity[Math.floor(Math.random() * itemsOfSelectedRarity.length)]
      : availableItems[Math.floor(Math.random() * availableItems.length)]

    // Get full item data
    const selectedItem = await prisma.item.findUnique({
      where: { id: selectedItemData.id },
      include: {
        collection: true
      }
    })

    if (!selectedItem) {
      return NextResponse.json(
        { error: 'Selected item not found' },
        { status: 500 }
      )
    }

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

      // Usar o novo sistema de processamento de drops
      const dropResult = await PackScarcityIntegration.processItemDrop(selectedItem.id, session.user.id)
      
      if (!dropResult.success) {
        throw new Error(dropResult.message || 'Failed to process item drop')
      }

      // Get the created user item for response
      const userItem = await tx.userItem.findFirst({
        where: {
          userId: session.user.id,
          itemId: selectedItem.id
        },
        orderBy: {
          obtainedAt: 'desc'
        },
        include: {
          limitedEdition: true
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
      const transactionDescription = selectedItem.isUnique 
        ? `Opened ${pack.name} - Received UNIQUE ${selectedItem.name} 🌟`
        : selectedItem.isLimitedEdition && userItem?.limitedEdition
        ? `Opened ${pack.name} - Received ${selectedItem.name} #${userItem.limitedEdition.serialNumber}`
        : `Opened ${pack.name} - Received ${selectedItem.name}`

      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'PACK_PURCHASE',
          amount: -pack.price,
          description: transactionDescription
        }
      })

      return {
        item: {
          ...selectedItem,
          isUnique: selectedItem.isUnique,
          scarcityLevel: selectedItem.scarcityLevel,
          limitedEdition: userItem?.limitedEdition ? {
            serialNumber: userItem.limitedEdition.serialNumber,
            maxEditions: selectedItem.maxEditions,
            mintedAt: userItem.limitedEdition.mintedAt
          } : null
        },
        newBalance: updatedUser.credits,
        pack: {
          id: pack.id,
          name: pack.name,
          price: pack.price
        },
        dropMessage: dropResult.message
      }
    })

    // Process stats and achievements in background (non-blocking) - same pattern as free packs
    setImmediate(async () => {
      try {
        const { achievementEngine } = await import('@/lib/achievements')
        const { achievementValidatorService } = await import('@/lib/achievement-validator')
        
        // Check if this is the user's first pack
        const isFirstPack = await prisma.packOpening.count({
          where: { userId: session.user.id }
        }) === 1
        
        // Process stats and achievements in parallel
        await Promise.allSettled([
          userStatsService.trackPackOpening(
            session.user.id,
            pack.id,
            selectedItem.id,
            selectedItem.rarity
          ),
          userStatsService.trackItemObtained(
            session.user.id,
            selectedItem.id,
            selectedItem.rarity,
            true
          ),
          // Add missing achievement check for PACK_OPENED
          achievementEngine.checkAchievements({
            type: 'PACK_OPENED',
            userId: session.user.id,
            data: {
              packId: pack.id,
              packType: effectivePackType,
              isFirstPack,
              itemId: selectedItem.id,
              itemRarity: selectedItem.rarity,
              items: [{ 
                id: selectedItem.id, 
                rarity: selectedItem.rarity,
                name: selectedItem.name 
              }]
            }
          })
        ])
        
        // Clear activity cache to show new activity immediately
        try {
          const { clearActivityCache } = await import('@/lib/activity-cache')
          clearActivityCache(session.user.id)
        } catch (cacheError) {
          console.warn('Failed to clear activity cache:', cacheError)
        }
        
        // Auto-validate achievements for new users (prevent missing achievements)
        if (isFirstPack) {
          achievementValidatorService.autoValidateAfterActivity(session.user.id, 'PACK_OPENED')
        }
        
      } catch (backgroundError) {
        console.error('Background processing error:', backgroundError)
      }
    })

    return NextResponse.json(result) // ⚡ Immediate response
  } catch (error) {
    console.error('Pack opening error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}