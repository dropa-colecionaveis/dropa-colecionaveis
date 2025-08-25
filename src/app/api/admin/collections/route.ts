import { NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    const collections = await prisma.collection.findMany({
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
          select: {
            id: true,
            name: true,
            rarity: true,
            itemNumber: true
          },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add progress calculation
    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        const completedCollections = await prisma.userCollection.count({
          where: {
            collectionId: collection.id,
            completedAt: { not: null }
          }
        })

        return {
          ...collection,
          stats: {
            totalItems: collection._count.items,
            totalUsers: collection._count.userCollections,
            completedByUsers: completedCollections,
            completionRate: collection._count.userCollections > 0 
              ? Math.round((completedCollections / collection._count.userCollections) * 100)
              : 0
          }
        }
      })
    )

    return NextResponse.json(collectionsWithStats)
  } catch (error) {
    console.error('Collections fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
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
    const { name, description, themeId, customTheme, imageUrl, maxItems, isLimited } = body

    // Validate required fields
    if (!name || (!themeId && !customTheme) || !maxItems) {
      return NextResponse.json(
        { error: 'Name, theme (themeId or customTheme) and maxItems are required' },
        { status: 400 }
      )
    }

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

    // Check if collection name already exists
    const existingCollection = await prisma.collection.findUnique({
      where: { name }
    })

    if (existingCollection) {
      return NextResponse.json(
        { error: 'Collection name already exists' },
        { status: 400 }
      )
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        themeId,
        customTheme,
        imageUrl,
        maxItems: parseInt(maxItems),
        isLimited: Boolean(isLimited),
        isActive: true
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
        items: true,
        _count: {
          select: {
            items: true,
            userCollections: true
          }
        }
      }
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('Collection creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}