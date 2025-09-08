import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function PUT(req: NextRequest, { params }: { params: { packId: string } }) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    const { type, name, description, price, isActive } = await req.json()
    const packId = params.packId

    // Handle type assignment - support both legacy enum types and custom types
    let updateData: any = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(isActive !== undefined && { isActive })
    }

    if (type !== undefined) {
      // Check if it's a legacy enum type
      const legacyTypes = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
      
      if (legacyTypes.includes(type)) {
        // Use legacy enum
        updateData.type = type
        updateData.customTypeId = null
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
        updateData.type = null
        updateData.customTypeId = customType.id
      }
    }

    const updatedPack = await prisma.pack.update({
      where: { id: packId },
      data: updateData,
      include: {
        customType: true
      }
    })

    // Transform response to include unified type information
    const effectiveType = updatedPack.customType ? updatedPack.customType.name : updatedPack.type
    const transformedPack = {
      ...updatedPack,
      type: effectiveType
    }

    return NextResponse.json(transformedPack)
  } catch (error) {
    console.error('Update pack error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}