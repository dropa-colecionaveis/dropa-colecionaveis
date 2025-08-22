import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(
  req: Request,
  { params }: { params: { userItemId: string } }
) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { autoSellService } = await import('@/lib/auto-sell')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userItemId } = params

    if (!userItemId) {
      return NextResponse.json(
        { error: 'UserItem ID is required' },
        { status: 400 }
      )
    }

    // Usar o serviço de auto-sell para vender o item individual
    const result = await autoSellService.sellSingleItem(session.user.id, userItemId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      salePrice: result.salePrice,
      itemName: result.itemName,
      creditsReceived: result.creditsReceived
    })
  } catch (error) {
    console.error('Individual auto-sell error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}