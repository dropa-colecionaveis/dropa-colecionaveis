import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PackType } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Free pack generation probabilities based on pack price/rarity - v2
const FREE_PACK_PROBABILITIES = {
  BRONZE: 60,    // 60% chance - cheapest pack
  SILVER: 25,    // 25% chance - medium pack  
  GOLD: 12,      // 12% chance - expensive pack
  PLATINUM: 2.5, // 2.5% chance - very expensive
  DIAMOND: 0.5   // 0.5% chance - most expensive/rare
}

function selectRandomPack(): string {
  const random = Math.random() * 100
  let cumulative = 0
  
  const packTypes = Object.entries(FREE_PACK_PROBABILITIES)
  
  for (const [packType, probability] of packTypes) {
    cumulative += probability
    if (random <= cumulative) {
      return packType
    }
  }
  
  // Fallback to BRONZE if something goes wrong
  return 'BRONZE'
}

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('Free pack generate: No session or user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User requesting free pack:', session.user.id)

    // Check if user already received their free pack
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hasReceivedFreePack: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.hasReceivedFreePack) {
      return NextResponse.json({ error: 'User already received their free pack' }, { status: 400 })
    }

    // Select random pack type based on probabilities
    const selectedPackType = selectRandomPack()
    
    // Debug: List all available packs
    const allPacks = await prisma.pack.findMany({
      where: { isActive: true }
    })
    console.log('All available packs:', allPacks.map(p => ({ id: p.id, type: p.type, name: p.name })))
    
    // Find the pack of the selected type
    const pack = await prisma.pack.findFirst({
      where: { 
        type: selectedPackType as PackType,
        isActive: true 
      }
    })

    console.log('Selected pack type:', selectedPackType)
    console.log('Found pack:', pack)

    if (!pack) {
      return NextResponse.json({ error: 'No pack available' }, { status: 404 })
    }

    // Create free pack grant and mark user as having received free pack
    const [freePackGrant] = await prisma.$transaction([
      prisma.freePackGrant.create({
        data: {
          userId: session.user.id,
          packId: pack.id
        },
        include: {
          pack: true
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { hasReceivedFreePack: true }
      })
    ])

    return NextResponse.json({
      success: true,
      freePack: freePackGrant,
      message: `Parabéns! Você ganhou um ${pack.name} grátis!`
    })

  } catch (error) {
    console.error('Free pack generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}