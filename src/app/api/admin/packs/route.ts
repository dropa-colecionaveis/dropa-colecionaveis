import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    const packs = await prisma.pack.findMany({
      include: {
        probabilities: {
          orderBy: {
            percentage: 'desc'
          }
        },
        customType: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Transform packs to include unified type information
    const transformedPacks = packs.map(pack => {
      // If pack uses custom type, use that; otherwise use legacy enum type
      const effectiveType = pack.customType ? pack.customType.name : pack.type
      
      return {
        ...pack,
        type: effectiveType // This will be the type name to use in frontend
      }
    })

    return NextResponse.json(transformedPacks)
  } catch (error) {
    console.error('Admin packs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
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

    // Handle type assignment - support both legacy enum types and custom types
    let packData: any = {
      name,
      description,
      price: parseFloat(price),
      isActive: true,
      probabilities: {
        create: Object.entries(probabilities).map(([rarity, percentage]) => ({
          rarity: rarity as any,
          percentage: parseFloat(percentage as string)
        }))
      }
    }

    // Check if it's a legacy enum type or custom type
    const legacyTypes = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
    
    if (legacyTypes.includes(type)) {
      // Use legacy enum
      packData.type = type
      packData.customTypeId = null
    } else {
      // Find custom type by name
      const customType = await prisma.packTypeCustom.findUnique({
        where: { name: type }
      })

      if (!customType) {
        return NextResponse.json(
          { error: `Custom pack type '${type}' not found` },
          { status: 404 }
        )
      }

      if (!customType.isActive) {
        return NextResponse.json(
          { error: `Pack type '${customType.displayName}' is not active` },
          { status: 400 }
        )
      }

      // Use custom type
      packData.type = null
      packData.customTypeId = customType.id
    }

    // Create pack with probabilities
    const pack = await prisma.pack.create({
      data: packData,
      include: {
        probabilities: {
          orderBy: {
            percentage: 'desc'
          }
        },
        customType: true
      }
    })

    // Transform response to include unified type information
    const effectiveType = pack.customType ? pack.customType.name : pack.type
    const transformedPack = {
      ...pack,
      type: effectiveType
    }

    return NextResponse.json(transformedPack, { status: 201 })
  } catch (error) {
    console.error('Pack creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}