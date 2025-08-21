import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const packs = await prisma.pack.findMany({
      where: {
        isActive: true
      },
      include: {
        probabilities: {
          orderBy: {
            percentage: 'desc'
          }
        }
      },
      orderBy: {
        price: 'asc'
      }
    })

    return NextResponse.json(packs)
  } catch (error) {
    console.error('Error fetching packs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}