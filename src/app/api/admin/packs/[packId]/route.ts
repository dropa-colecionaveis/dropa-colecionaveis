import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function PUT(req: Request, { params }: { params: { packId: string } }) {
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