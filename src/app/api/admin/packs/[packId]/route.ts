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

    const { name, description, price, isActive } = await req.json()
    const packId = params.packId

    const updatedPack = await prisma.pack.update({
      where: { id: packId },
      data: {
        name,
        description,
        price,
        isActive
      }
    })

    return NextResponse.json(updatedPack)
  } catch (error) {
    console.error('Update pack error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}