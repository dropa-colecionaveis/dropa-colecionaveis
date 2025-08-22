import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
      include: {
        theme: {
          select: {
            id: true,
            name: true,
            displayName: true,
            emoji: true,
            colorClass: true,
            borderClass: true
          }
        },
        items: {
          orderBy: {
            itemNumber: 'asc'
          }
        },
        _count: {
          select: {
            items: true,
            userCollections: true
          }
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Collection fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, description, themeId, customTheme, imageUrl, maxItems, isLimited, isActive } = body

    // Validate theme exists if themeId is provided
    if (themeId) {
      const theme = await prisma.theme.findUnique({
        where: { id: themeId }
      })
      
      if (!theme) {
        return NextResponse.json(
          { error: 'Invalid theme ID' },
          { status: 400 }
        )
      }
    }

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id: params.collectionId }
    })

    if (!existingCollection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with other collections
    if (name && name !== existingCollection.name) {
      const nameConflict = await prisma.collection.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Collection name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCollection = await prisma.collection.update({
      where: { id: params.collectionId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(themeId !== undefined && { themeId }),
        ...(customTheme !== undefined && { customTheme }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(maxItems && { maxItems: parseInt(maxItems) }),
        ...(isLimited !== undefined && { isLimited: Boolean(isLimited) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      },
      include: {
        theme: {
          select: {
            id: true,
            name: true,
            displayName: true,
            emoji: true,
            colorClass: true,
            borderClass: true
          }
        },
        items: {
          orderBy: {
            itemNumber: 'asc'
          }
        },
        _count: {
          select: {
            items: true,
            userCollections: true
          }
        }
      }
    })

    return NextResponse.json(updatedCollection)
  } catch (error) {
    console.error('Collection update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Check if collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
      include: {
        _count: {
          select: {
            items: true,
            userCollections: true
          }
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if collection has items or users
    if (collection._count.items > 0) {
      return NextResponse.json(
        { error: 'Cannot delete collection that contains items. Remove all items first.' },
        { status: 400 }
      )
    }

    if (collection._count.userCollections > 0) {
      return NextResponse.json(
        { error: 'Cannot delete collection that users have progress on.' },
        { status: 400 }
      )
    }

    await prisma.collection.delete({
      where: { id: params.collectionId }
    })

    return NextResponse.json({ message: 'Collection deleted successfully' })
  } catch (error) {
    console.error('Collection deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}