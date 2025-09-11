import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { getPaymentStatus, mapMercadoPagoStatus } = await import('@/lib/mercadopago')
    const { userStatsService } = await import('@/lib/user-stats')
    
    console.log('🔍 Manual payment status check...')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            credits: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If already approved, return current status
    if (payment.status === 'APPROVED') {
      return NextResponse.json({
        success: true,
        status: 'APPROVED',
        message: 'Payment already approved',
        credits: payment.user?.credits || 0
      })
    }

    // Check if external ID exists
    if (!payment.externalId) {
      return NextResponse.json({
        success: false,
        error: 'Payment external ID not found',
        status: payment.status,
        credits: payment.user?.credits || 0
      })
    }

    // Check status with Mercado Pago
    console.log(`🔍 Checking MP status for external ID: ${payment.externalId}`)
    
    let paymentDetails
    try {
      paymentDetails = await getPaymentStatus(payment.externalId)
    } catch (error) {
      console.error('Error checking Mercado Pago status:', error)
      return NextResponse.json({
        success: true,
        status: payment.status,
        message: 'Could not check payment status with Mercado Pago',
        credits: payment.user?.credits || 0
      })
    }

    const newStatus = mapMercadoPagoStatus(paymentDetails.status)
    console.log(`Payment ${payment.id} status: ${paymentDetails.status} -> ${newStatus}`)

    // If status hasn't changed, return current status
    if (payment.status === newStatus) {
      return NextResponse.json({
        success: true,
        status: newStatus,
        message: 'Payment status unchanged',
        credits: payment.user?.credits || 0
      })
    }

    // Handle approved payments
    if (newStatus === 'APPROVED' && (payment.status as string) !== 'APPROVED') {
      console.log('💰 Payment approved! Adding credits...')

      // Add credits to user and record transaction
      await prisma.$transaction(async (tx) => {
        // Update user credits
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            credits: {
              increment: payment.credits
            }
          }
        })

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: payment.userId,
            type: 'PURCHASE_CREDITS',
            amount: payment.credits,
            description: `Purchased ${payment.credits} credits for R$ ${payment.amount} (${payment.method})`,
          }
        })

        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            approvedAt: new Date(),
            mercadoPagoData: {
              ...payment.mercadoPagoData as any,
              manualStatusUpdate: paymentDetails,
              updatedAt: new Date().toISOString(),
            }
          }
        })
      })

      // Track achievement progress for credit purchase
      try {
        await userStatsService.trackCreditsPurchase(payment.userId, payment.amount)
      } catch (statsError) {
        console.error('Error tracking achievement progress:', statsError)
      }

      // Get updated user credits
      const updatedUser = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { credits: true }
      })

      console.log(`✅ Credits added! User now has ${updatedUser?.credits} credits`)

      return NextResponse.json({
        success: true,
        status: 'APPROVED',
        message: `Payment approved! ${payment.credits} credits added to your account.`,
        credits: updatedUser?.credits || 0,
        addedCredits: payment.credits
      })
    }
    
    // Handle rejected/failed payments
    else if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          failedAt: new Date(),
          failureReason: paymentDetails.statusDetail || `Payment ${newStatus.toLowerCase()}`,
          mercadoPagoData: {
            ...payment.mercadoPagoData as any,
            manualStatusUpdate: paymentDetails,
            updatedAt: new Date().toISOString(),
          }
        }
      })

      return NextResponse.json({
        success: false,
        status: newStatus,
        message: `Payment ${newStatus.toLowerCase()}: ${paymentDetails.statusDetail || 'Unknown reason'}`,
        credits: payment.user?.credits || 0
      })
    }
    
    // Handle other status changes
    else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          mercadoPagoData: {
            ...payment.mercadoPagoData as any,
            manualStatusUpdate: paymentDetails,
            updatedAt: new Date().toISOString(),
          }
        }
      })

      return NextResponse.json({
        success: true,
        status: newStatus,
        message: `Payment status: ${newStatus}`,
        credits: payment.user?.credits || 0
      })
    }

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}