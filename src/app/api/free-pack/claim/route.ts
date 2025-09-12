import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { achievementEngine } = await import('@/lib/achievements')
    const { userStatsService } = await import('@/lib/user-stats')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { freePackGrantId } = await req.json()

    if (!freePackGrantId) {
      return NextResponse.json({ error: 'Free pack grant ID is required' }, { status: 400 })
    }

    console.log(`[DEBUG] Attempting to claim free pack grant: ${freePackGrantId} for user: ${session.user.id}`)

    // Find the free pack grant
    const freePackGrant = await prisma.freePackGrant.findFirst({
      where: {
        id: freePackGrantId,
        userId: session.user.id,
        claimed: false
      },
      include: {
        pack: {
          include: {
            probabilities: true,
            customType: true
          }
        }
      }
    })

    if (!freePackGrant) {
      console.log(`[DEBUG] Free pack grant not found: ${freePackGrantId}`)
      return NextResponse.json({ error: 'Free pack not found or already claimed' }, { status: 404 })
    }

    console.log(`[DEBUG] Found valid free pack grant: ${freePackGrant.id}`)

    // Generate random item based on pack probabilities (reuse existing logic)
    const probabilities = freePackGrant.pack.probabilities
    const random = Math.random() * 100
    let cumulative = 0
    let selectedRarity = 'COMUM'

    for (const prob of probabilities) {
      cumulative += prob.percentage
      if (random <= cumulative) {
        selectedRarity = prob.rarity
        break
      }
    }

    // Get random item of selected rarity (usando cache)
    const { getCachedItemsByRarity } = await import('@/lib/rarity-system')
    const itemsByRarity = await getCachedItemsByRarity()
    const items = itemsByRarity[selectedRarity as keyof typeof itemsByRarity]

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items available for this rarity' }, { status: 404 })
    }

    const randomItem = items[Math.floor(Math.random() * items.length)]

    // Check if this is the user's first pack and first item BEFORE creating records
    const userPacksCount = await prisma.packOpening.count({
      where: { userId: session.user.id }
    })
    const userItemsCount = await prisma.userItem.count({
      where: { userId: session.user.id }
    })

    const isFirstPack = userPacksCount === 0 // Will be first pack
    const isFirstItem = userItemsCount === 0 // Will be first item

    // Create user item, pack opening record, and mark free pack as claimed
    const [userItem, packOpening] = await prisma.$transaction([
      prisma.userItem.create({
        data: {
          userId: session.user.id,
          itemId: randomItem.id
        },
        include: {
          item: true
        }
      }),
      prisma.packOpening.create({
        data: {
          userId: session.user.id,
          packId: freePackGrant.packId,
          itemId: randomItem.id
        }
      }),
      prisma.freePackGrant.update({
        where: { id: freePackGrantId },
        data: { 
          claimed: true,
          claimedAt: new Date()
        }
      })
    ])

    // Process stats and achievements with integrity protection
    const { integrityGuard } = await import('@/lib/integrity-guard')
    
    const { result: statsResult, integrity } = await integrityGuard.wrapPackOperation(
      session.user.id,
      async () => {
        // Process stats and achievements in parallel but wait for completion
        const results = await Promise.allSettled([
          userStatsService.trackPackOpening(
            session.user.id,
            freePackGrant.packId,
            randomItem.id,
            randomItem.rarity as any
          ),
          userStatsService.trackItemObtained(
            session.user.id,
            randomItem.id,
            randomItem.rarity as any,
            true
          ),
          achievementEngine.checkAchievements({
            type: 'PACK_OPENED',
            userId: session.user.id,
            data: {
              packId: freePackGrant.packId,
              packType: freePackGrant.pack.customType ? freePackGrant.pack.customType.name : freePackGrant.pack.type || 'UNKNOWN',
              isFirstPack,
              items: [randomItem]
            }
          }),
          achievementEngine.checkAchievements({
            type: 'ITEM_OBTAINED',
            userId: session.user.id,
            data: {
              itemId: randomItem.id,
              rarity: randomItem.rarity,
              isFirstItem
            }
          })
        ])
        
        // Check for failures
        const failedOperations = results.filter(result => result.status === 'rejected')
        if (failedOperations.length > 0) {
          console.error('Some free pack operations failed:', failedOperations)
          throw new Error(`${failedOperations.length} operations failed`)
        }
        
        return { success: true, failedOperations: 0 }
      },
      freePackGrant.packId,
      'FREE_PACK'
    )
    
    // Log integrity status
    if (integrity.autoFixed) {
      console.log('✅ Free pack integrity: Auto-fixed inconsistencies')
    } else if (!integrity.isValid) {
      console.warn('⚠️ Free pack integrity: Issues detected but not fixed:', integrity.errors)
    } else {
      console.log('✅ Free pack integrity: All checks passed')
    }

    return NextResponse.json({
      success: true,
      item: randomItem,
      pack: freePackGrant.pack,
      message: `Parabéns! Você ganhou: ${randomItem.name}!`
    })

  } catch (error) {
    console.error('Free pack claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}