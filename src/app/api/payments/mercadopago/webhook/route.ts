import { NextResponse } from 'next/server'
import type { WebhookNotification, PaymentStatusUpdate } from '@/types/payments'

export async function POST(req: Request) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { getPaymentStatus, mapMercadoPagoStatus } = await import('@/lib/mercadopago')
    const { userStatsService } = await import('@/lib/user-stats')

    const body = await req.text()
    const notification: WebhookNotification = JSON.parse(body)

    console.log('Received webhook notification:', notification)

    // Only process payment notifications
    if (notification.type !== 'payment') {
      console.log('Ignoring non-payment notification')
      return NextResponse.json({ received: true })
    }

    const mercadoPagoPaymentId = notification.data.id

    // Get payment details from Mercado Pago
    const paymentDetails = await getPaymentStatus(mercadoPagoPaymentId)
    const newStatus = mapMercadoPagoStatus(paymentDetails.status)

    console.log(`Payment ${mercadoPagoPaymentId} status: ${paymentDetails.status} -> ${newStatus}`)

    // Find payment in our database
    const payment = await prisma.payment.findFirst({
      where: { 
        externalId: mercadoPagoPaymentId 
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
      console.warn(`Payment not found for external ID: ${mercadoPagoPaymentId}`)
      return NextResponse.json({ received: true })
    }

    // Don't process if status hasn't changed
    if (payment.status === newStatus) {
      console.log(`Payment ${payment.id} status unchanged: ${newStatus}`)
      return NextResponse.json({ received: true })
    }

    // Prepare status update data
    const statusUpdate: PaymentStatusUpdate = {
      paymentId: payment.id,
      status: newStatus,
      statusDetail: paymentDetails.statusDetail,
    }

    // Handle approved payments
    if (newStatus === 'APPROVED' && payment.status !== 'APPROVED') {
      statusUpdate.approvedAt = new Date()

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
            approvedAt: statusUpdate.approvedAt,
            webhookData: notification as any,
            mercadoPagoData: {
              ...payment.mercadoPagoData as any,
              webhookUpdate: paymentDetails,
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
        // Don't fail the webhook processing
      }

      console.log(`✅ Payment approved and credits added: ${payment.id} - ${payment.credits} credits to user ${payment.userId}`)
    }
    // Handle rejected/failed payments
    else if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
      statusUpdate.failedAt = new Date()
      statusUpdate.failureReason = paymentDetails.statusDetail || `Payment ${newStatus.toLowerCase()}`

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          failedAt: statusUpdate.failedAt,
          failureReason: statusUpdate.failureReason,
          webhookData: notification as any,
          mercadoPagoData: {
            ...payment.mercadoPagoData as any,
            webhookUpdate: paymentDetails,
            updatedAt: new Date().toISOString(),
          }
        }
      })

      console.log(`❌ Payment ${newStatus.toLowerCase()}: ${payment.id} - Reason: ${statusUpdate.failureReason}`)
    }
    // Handle other status changes
    else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          webhookData: notification as any,
          mercadoPagoData: {
            ...payment.mercadoPagoData as any,
            webhookUpdate: paymentDetails,
            updatedAt: new Date().toISOString(),
          }
        }
      })

      console.log(`🔄 Payment status updated: ${payment.id} - ${newStatus}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Return 200 to prevent Mercado Pago from retrying
    // Log the error for investigation
    return NextResponse.json({ 
      received: true, 
      error: 'Processing failed but acknowledged' 
    })
  }
}

// GET method to verify webhook endpoint is accessible
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Mercado Pago webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}