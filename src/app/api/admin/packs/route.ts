import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const packs = await prisma.pack.findMany({
      include: {
        probabilities: {
          orderBy: {
            percentage: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(packs)
  } catch (error) {
    console.error('Admin packs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { type, name, description, price, probabilities } = body

    // Validate required fields
    if (!type || !name || !price) {
      return NextResponse.json(
        { error: 'Type, name and price are required' },
        { status: 400 }
      )
    }

    // Validate probabilities sum to 100
    const totalPercentage = Object.values(probabilities).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Probabilities must sum to 100%' },
        { status: 400 }
      )
    }

    // Create pack with probabilities
    const pack = await prisma.pack.create({
      data: {
        type,
        name,
        description,
        price: parseFloat(price),
        isActive: true,
        probabilities: {
          create: Object.entries(probabilities).map(([rarity, percentage]) => ({
            rarity,
            percentage: parseFloat(percentage as string)
          }))
        }
      },
      include: {
        probabilities: {
          orderBy: {
            percentage: 'desc'
          }
        }
      }
    })

    return NextResponse.json(pack, { status: 201 })
  } catch (error) {
    console.error('Pack creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}