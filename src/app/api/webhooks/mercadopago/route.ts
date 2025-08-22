import { NextRequest, NextResponse } from 'next/server'

// Mercado Pago payment statuses
const MP_STATUS_MAPPING = {
  'approved': 'APPROVED',
  'pending': 'PENDING',
  'rejected': 'REJECTED',
  'cancelled': 'CANCELLED',
  'refunded': 'REFUNDED',
  'charged_back': 'REFUNDED'
} as const

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let ipAddress: string | undefined
  let userAgent: string | undefined

  try {
    const { webhookVerifier } = await import('@/lib/webhook-verifier')
    const { securityLogger } = await import('@/lib/security-logger')
    const { prisma } = await import('@/lib/prisma')
    const { userStatsService } = await import('@/lib/user-stats')
    // Extract request info
    ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                req.headers.get('x-real-ip') || 
                (req as any).ip
    userAgent = req.headers.get('user-agent') || undefined

    console.log('🔔 Webhook received from IP:', ipAddress)

    // Validate IP address
    if (ipAddress && !webhookVerifier.validateWebhookIP(ipAddress)) {
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'CRITICAL',
        ipAddress,
        userAgent,
        endpoint: '/api/webhooks/mercadopago',
        description: 'Webhook received from unauthorized IP address',
        metadata: {
          rejectedIP: ipAddress,
          expectedSource: 'Mercado Pago servers'
        }
      })

      return NextResponse.json(
        { error: 'Unauthorized IP address' },
        { status: 403 }
      )
    }

    // Get request body and headers
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature')
    const requestId = req.headers.get('x-request-id')
    const timestamp = req.headers.get('x-timestamp')

    console.log('🔔 Webhook headers:', {
      signature: signature ? '[PRESENT]' : '[MISSING]',
      requestId,
      timestamp,
      contentLength: rawBody.length
    })

    // Verify webhook signature
    if (!webhookVerifier.verifyMercadoPagoWebhook(rawBody, signature, timestamp)) {
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'CRITICAL',
        ipAddress,
        userAgent,
        endpoint: '/api/webhooks/mercadopago',
        description: 'Webhook signature verification failed',
        metadata: {
          hasSignature: !!signature,
          hasTimestamp: !!timestamp,
          requestId,
          bodyLength: rawBody.length
        }
      })

      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Parse webhook data
    let webhookData
    try {
      webhookData = JSON.parse(rawBody)
    } catch (error) {
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        ipAddress,
        userAgent,
        endpoint: '/api/webhooks/mercadopago',
        description: 'Invalid JSON in webhook payload',
        metadata: {
          error: error instanceof Error ? error.message : 'Parse error',
          bodyPreview: rawBody.substring(0, 100)
        }
      })

      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Process webhook data
    const result = await webhookVerifier.processWebhookData(
      webhookData,
      ipAddress,
      userAgent
    )

    if (!result.isValid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log('✅ Webhook data validated:', {
      paymentId: result.paymentId,
      status: result.status,
      webhookId: result.metadata?.webhookId
    })

    // Process payment update
    if (result.paymentId && result.status) {
      await processPaymentUpdate(result.paymentId, result.status, webhookData, ipAddress)
    }

    // Log successful webhook processing
    await securityLogger.log({
      type: 'PAYMENT_ATTEMPT',
      severity: 'LOW',
      ipAddress,
      userAgent,
      endpoint: '/api/webhooks/mercadopago',
      description: `Webhook processed successfully: ${result.status}`,
      metadata: {
        paymentId: result.paymentId,
        webhookId: result.metadata?.webhookId,
        processingTime: Date.now() - startTime,
        liveMode: result.metadata?.liveMode
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      paymentId: result.paymentId
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)

    await securityLogger.log({
      type: 'API_ERROR',
      severity: 'HIGH',
      ipAddress,
      userAgent,
      endpoint: '/api/webhooks/mercadopago',
      description: `Webhook processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Process payment status update
async function processPaymentUpdate(
  paymentId: string, 
  status: string, 
  webhookData: any,
  ipAddress?: string
): Promise<void> {
  try {
    console.log(`🔄 Processing payment update: ${paymentId} -> ${status}`)

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: { externalId: paymentId },
      include: { user: true }
    })

    if (!payment) {
      console.warn(`⚠️ Payment not found in database: ${paymentId}`)
      
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        ipAddress,
        description: `Webhook received for unknown payment: ${paymentId}`,
        metadata: {
          paymentId,
          webhookStatus: status,
          webhookData: webhookData
        }
      })
      return
    }

    // Map Mercado Pago status to our status
    const mappedStatus = MP_STATUS_MAPPING[status as keyof typeof MP_STATUS_MAPPING] || 'PENDING'

    // Check if status actually changed
    if (payment.status === mappedStatus) {
      console.log(`ℹ️ Payment status unchanged: ${paymentId} already ${mappedStatus}`)
      return
    }

    console.log(`📝 Updating payment ${paymentId}: ${payment.status} -> ${mappedStatus}`)

    // Update payment in database
    await prisma.$transaction(async (tx) => {
      // Update payment record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: mappedStatus,
          approvedAt: mappedStatus === 'APPROVED' ? new Date() : payment.approvedAt,
          failedAt: mappedStatus === 'REJECTED' ? new Date() : payment.failedAt,
          failureReason: mappedStatus === 'REJECTED' ? `Rejected by payment processor` : payment.failureReason,
          webhookData: {
            ...(payment.webhookData && typeof payment.webhookData === 'object' ? payment.webhookData : {}),
            lastWebhook: {
              status,
              receivedAt: new Date().toISOString(),
              data: webhookData
            }
          }
        }
      })

      // If payment was approved and credits weren't added yet
      if (mappedStatus === 'APPROVED' && payment.status !== 'APPROVED') {
        console.log(`💰 Adding credits to user ${payment.userId}: ${payment.credits} credits`)

        // Add credits to user
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            credits: {
              increment: payment.credits
            }
          }
        })

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: payment.userId,
            type: 'PURCHASE_CREDITS',
            amount: payment.credits,
            description: `Purchased ${payment.credits} credits for R$ ${payment.amount} (Webhook Confirmation)`
          }
        })

        // Track achievement progress
        try {
          await userStatsService.trackCreditsPurchase(payment.userId, payment.amount)
        } catch (statsError) {
          console.error('Error tracking achievement progress:', statsError)
        }

        console.log(`✅ Credits added successfully for payment ${paymentId}`)
      }
    })

    // Log payment status change
    await securityLogger.logPayment(
      mappedStatus === 'APPROVED',
      payment.userId,
      payment.amount,
      payment.method,
      ipAddress,
      {
        paymentId: payment.id,
        externalId: paymentId,
        oldStatus: payment.status,
        newStatus: mappedStatus,
        source: 'webhook',
        webhookData: webhookData
      }
    )

    console.log(`✅ Payment ${paymentId} updated successfully: ${payment.status} -> ${mappedStatus}`)

  } catch (error) {
    console.error(`❌ Error processing payment update for ${paymentId}:`, error)

    await securityLogger.log({
      type: 'API_ERROR',
      severity: 'HIGH',
      ipAddress,
      description: `Failed to process payment update: ${paymentId}`,
      metadata: {
        paymentId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookData
      }
    })

    throw error
  }
}

// GET method for webhook verification (some providers require this)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('hub.challenge')
  
  if (challenge) {
    // Webhook verification challenge
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({
    service: 'Mercado Pago Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
    webhookURL: webhookVerifier.generateWebhookURL(),
    setupInstructions: webhookVerifier.getWebhookSetupInstructions()
  })
}