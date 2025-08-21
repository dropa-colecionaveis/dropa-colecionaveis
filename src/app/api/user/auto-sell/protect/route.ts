import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autoSellService } from '@/lib/auto-sell'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userItemId, protect, reason } = await req.json()

    if (!userItemId) {
      return NextResponse.json(
        { error: 'userItemId is required' },
        { status: 400 }
      )
    }

    // Verificar se o item pertence ao usuário
    const userItem = await prisma.userItem.findFirst({
      where: {
        id: userItemId,
        userId: session.user.id
      }
    })

    if (!userItem) {
      return NextResponse.json(
        { error: 'Item not found or you do not own this item' },
        { status: 404 }
      )
    }

    const result = await autoSellService.toggleItemProtection(
      session.user.id, 
      userItemId, 
      protect, 
      reason
    )

    return NextResponse.json({
      success: true,
      protected: protect,
      message: protect ? 'Item protected from auto-sell' : 'Item protection removed'
    })
  } catch (error) {
    console.error('Auto-sell protection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}