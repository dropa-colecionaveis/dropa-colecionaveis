import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Rarity } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const items = await prisma.item.findMany({
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            theme: true,
            isLimited: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { collection: { name: 'asc' } },
        { itemNumber: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Admin items fetch error:', error)
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

    const { name, description, rarity, value, imageUrl, collectionId, isLimitedEdition, maxEditions } = await req.json()

    if (!name || !rarity || !value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rarity
    if (!Object.values(Rarity).includes(rarity)) {
      return NextResponse.json(
        { error: 'Invalid rarity value' },
        { status: 400 }
      )
    }

    // Validate collection if provided
    let itemNumber = null
    if (collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId }
      })

      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 400 }
        )
      }

      // Get the next item number for this collection
      const lastItem = await prisma.item.findFirst({
        where: { collectionId },
        orderBy: { itemNumber: 'desc' }
      })

      itemNumber = lastItem ? (lastItem.itemNumber || 0) + 1 : 1

      // Check if collection is at max capacity
      const itemCount = await prisma.item.count({
        where: { collectionId }
      })

      if (itemCount >= collection.maxItems) {
        return NextResponse.json(
          { error: `Collection already has maximum items (${collection.maxItems})` },
          { status: 400 }
        )
      }
    }

    const newItem = await prisma.item.create({
      data: {
        name,
        description: description || null,
        rarity,
        value: parseInt(value),
        imageUrl: imageUrl || '/items/default.jpg',
        isActive: true,
        collectionId: collectionId || null,
        itemNumber,
        isLimitedEdition: Boolean(isLimitedEdition),
        maxEditions: isLimitedEdition && maxEditions ? parseInt(maxEditions) : null,
        currentEditions: 0
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            theme: true,
            isLimited: true
          }
        }
      }
    })

    return NextResponse.json(newItem)
  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}