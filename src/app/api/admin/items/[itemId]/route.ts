import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { Rarity } from '@prisma/client'

export async function PUT(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    const body = await req.json()
    const { 
      name, description, rarity, value, imageUrl, isActive, collectionId, itemNumber, isLimitedEdition, maxEditions,
      // Novos campos do Sistema de Escassez
      isUnique, scarcityLevel, isTemporal, availableFrom, availableUntil
    } = body
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

    // Handle item number and collection change
    let finalItemNumber = currentItem.itemNumber
    
    // If itemNumber is provided explicitly, use it
    if (itemNumber !== undefined && itemNumber !== null) {
      finalItemNumber = parseInt(itemNumber.toString()) || null
    } else if (collectionId !== undefined && collectionId !== currentItem.collectionId) {
      // Auto-assign only if changing collection and no explicit number provided
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

        finalItemNumber = lastItem ? (lastItem.itemNumber || 0) + 1 : 1
      } else {
        // Removing from collection
        finalItemNumber = null
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
        itemNumber: finalItemNumber,
        isLimitedEdition: isLimitedEdition !== undefined ? Boolean(isLimitedEdition) : currentItem.isLimitedEdition,
        maxEditions: isLimitedEdition !== undefined 
          ? (isLimitedEdition && maxEditions ? parseInt(maxEditions) : null)
          : currentItem.maxEditions,
        // Novos campos do Sistema de Escassez
        isUnique: isUnique !== undefined ? Boolean(isUnique) : currentItem.isUnique,
        scarcityLevel: scarcityLevel !== undefined ? scarcityLevel : currentItem.scarcityLevel,
        isTemporal: isTemporal !== undefined ? Boolean(isTemporal) : currentItem.isTemporal,
        availableFrom: availableFrom !== undefined ? (availableFrom ? new Date(availableFrom) : null) : currentItem.availableFrom,
        availableUntil: availableUntil !== undefined ? (availableUntil ? new Date(availableUntil) : null) : currentItem.availableUntil
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