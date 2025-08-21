import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Rarity } from '@prisma/client'

export async function PUT(req: Request, { params }: { params: { packId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const probabilities = await req.json()
    const packId = params.packId

    // Validate that probabilities add up to 100
    const total = Object.values(probabilities).reduce((sum: number, val) => sum + (parseFloat(val as string) || 0), 0)
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Probabilities must add up to 100%' },
        { status: 400 }
      )
    }

    // Update probabilities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing probabilities
      await tx.packProbability.deleteMany({
        where: { packId }
      })

      // Create new probabilities
      const probabilityData = Object.entries(probabilities).map(([rarity, percentage]) => ({
        packId,
        rarity: rarity as Rarity,
        percentage: parseFloat(percentage as string)
      }))

      await tx.packProbability.createMany({
        data: probabilityData
      })

      // Return updated pack with probabilities
      return await tx.pack.findUnique({
        where: { id: packId },
        include: {
          probabilities: {
            orderBy: {
              percentage: 'desc'
            }
          }
        }
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Update pack probabilities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}