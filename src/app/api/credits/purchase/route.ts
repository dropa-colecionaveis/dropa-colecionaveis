import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { userStatsService } = await import('@/lib/user-stats')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { credits, amount, packageId } = await req.json()

    if (!credits || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TODO: Here you would integrate with a real payment processor
    // For now, we'll simulate a successful payment

    // Update user credits
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        credits: {
          increment: credits
        }
      }
    })

    // Record the transaction
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'PURCHASE_CREDITS',
        amount: credits,
        description: `Purchased ${credits} credits for R$ ${amount}`,
      }
    })

    // Track achievement progress for credit purchase
    try {
      await userStatsService.trackCreditsPurchase(session.user.id, amount)
    } catch (statsError) {
      console.error('Error tracking achievement progress:', statsError)
      // Don't fail the main transaction
    }

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.credits
    })
  } catch (error) {
    console.error('Credit purchase error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}