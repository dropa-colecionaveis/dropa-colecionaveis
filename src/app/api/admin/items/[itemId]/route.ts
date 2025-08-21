import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Rarity } from '@prisma/client'

export async function PUT(req: Request, { params }: { params: { itemId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, description, rarity, value, imageUrl, isActive, collectionId, isLimitedEdition, maxEditions } = body
    const itemId = params.itemId

    if (!name || !rarity || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, rarity, or value' },
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

    // Get current item to preserve fields if not provided
    const currentItem = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        collection: true
      }
    })

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Handle collection change
    let itemNumber = currentItem.itemNumber
    if (collectionId !== undefined && collectionId !== currentItem.collectionId) {
      if (collectionId) {
        // Validate new collection
        const collection = await prisma.collection.findUnique({
          where: { id: collectionId }
        })

        if (!collection) {
          return NextResponse.json(
            { error: 'Collection not found' },
            { status: 400 }
          )
        }

        // Check if collection is at max capacity (excluding current item if it's in the same collection)
        const itemCount = await prisma.item.count({
          where: { 
            collectionId,
            id: { not: itemId }
          }
        })

        if (itemCount >= collection.maxItems) {
          return NextResponse.json(
            { error: `Collection already has maximum items (${collection.maxItems})` },
            { status: 400 }
          )
        }

        // Get the next item number for this collection
        const lastItem = await prisma.item.findFirst({
          where: { 
            collectionId,
            id: { not: itemId }
          },
          orderBy: { itemNumber: 'desc' }
        })

        itemNumber = lastItem ? (lastItem.itemNumber || 0) + 1 : 1
      } else {
        // Removing from collection
        itemNumber = null
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name,
        description: description || null,
        rarity,
        value: parseInt(value.toString()),
        imageUrl: imageUrl || currentItem.imageUrl,
        isActive: isActive !== undefined ? isActive : currentItem.isActive,
        collectionId: collectionId !== undefined ? collectionId : currentItem.collectionId,
        itemNumber,
        isLimitedEdition: isLimitedEdition !== undefined ? Boolean(isLimitedEdition) : currentItem.isLimitedEdition,
        maxEditions: isLimitedEdition !== undefined 
          ? (isLimitedEdition && maxEditions ? parseInt(maxEditions) : null)
          : currentItem.maxEditions
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

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Update item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}