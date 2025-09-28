import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { checkRateLimit } = await import('@/lib/rate-limit')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Enhanced session validation for payment operations
    const { validatePaymentSession } = await import('@/lib/session-validator')
    const sessionValidation = await validatePaymentSession(req, authOptions)

    if (!sessionValidation.isValid) {
      return sessionValidation.response!
    }

    // 🛡️ RATE LIMITING CHECK para status checks
    const rateLimitResult = checkRateLimit(session.user.id, 'payment_status')

    if (!rateLimitResult.allowed) {
      console.warn(`⚠️ Status check rate limit exceeded for user ${session.user.id}`)
      return NextResponse.json(
        {
          error: 'Too many status check attempts',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '300',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Enhanced input validation for query parameters
    const { inputValidator } = await import('@/lib/input-validator')
    const { securityLogger } = await import('@/lib/security-logger')

    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        userId: session.user.id,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: '/api/payments/status',
        method: 'GET',
        description: 'Payment status check attempted without payment ID',
        metadata: {
          queryParams: Object.fromEntries(searchParams.entries())
        }
      })

      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Validate payment ID format (should be UUID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(paymentId)) {
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        userId: session.user.id,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: '/api/payments/status',
        method: 'GET',
        description: 'Invalid payment ID format provided',
        metadata: {
          providedPaymentId: paymentId.substring(0, 10) + '...', // Log partial ID for security
          validationError: 'Invalid UUID format'
        }
      })

      return NextResponse.json(
        { error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        userId: session.user.id // Ensure user can only check their own payments
      },
      select: {
        id: true,
        externalId: true,
        status: true,
        method: true,
        amount: true,
        credits: true,
        pixQrCode: true,
        pixQrCodeBase64: true,
        pixCopyPaste: true,
        expiresAt: true,
        approvedAt: true,
        failedAt: true,
        failureReason: true,
        createdAt: true,
        userId: true,
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If payment is still pending, check directly with Mercado Pago
    if (payment.status === 'PENDING' && payment.externalId) {
      try {
        const { getPaymentStatus, mapMercadoPagoStatus } = await import('@/lib/mercadopago')
        const { userStatsService } = await import('@/lib/user-stats')
        
        console.log(`🔍 [PAYMENT STATUS] Checking payment ${payment.id} (MP ID: ${payment.externalId}) directly with Mercado Pago API`)
        
        const mpPaymentStatus = await getPaymentStatus(payment.externalId)
        const newStatus = mapMercadoPagoStatus(mpPaymentStatus.status)
        
        console.log(`📊 [PAYMENT STATUS] MP API returned: ${mpPaymentStatus.status} -> Mapped to DB status: ${newStatus} (Current: ${payment.status})`)
        
        // If status changed, update in database
        if (newStatus !== payment.status) {
          console.log(`🔄 [PAYMENT STATUS] Status changed from ${payment.status} to ${newStatus} for payment ${payment.id}, updating database...`)
          
          if (newStatus === 'APPROVED') {
            // Handle approved payment
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
                    directCheck: mpPaymentStatus,
                    updatedAt: new Date().toISOString(),
                  }
                }
              })
            })

            // Track achievement progress
            try {
              await userStatsService.trackCreditsPurchase(payment.userId, payment.amount)
            } catch (statsError) {
              console.error('Error tracking achievement progress:', statsError)
            }

            console.log(`✅ [PAYMENT STATUS] Payment ${payment.id} approved! ${payment.credits} credits added to user ${payment.userId}`)
            
            return NextResponse.json({
              ...payment,
              status: newStatus,
              approvedAt: new Date(),
            })
            
          } else if (newStatus === 'REJECTED' || newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
            // Handle failed payment
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: newStatus,
                failedAt: new Date(),
                failureReason: mpPaymentStatus.statusDetail || `Payment ${newStatus.toLowerCase()}`,
                mercadoPagoData: {
                  directCheck: mpPaymentStatus,
                  updatedAt: new Date().toISOString(),
                }
              }
            })
            
            console.log(`❌ [PAYMENT STATUS] Payment ${payment.id} ${newStatus.toLowerCase()}: ${mpPaymentStatus.statusDetail || 'No reason provided'}`)
            
            return NextResponse.json({
              ...payment,
              status: newStatus,
              failedAt: new Date(),
              failureReason: mpPaymentStatus.statusDetail || `Payment ${newStatus.toLowerCase()}`,
            })
          } else {
            // Status changed but not final, just update
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: newStatus,
                mercadoPagoData: {
                  directCheck: mpPaymentStatus,
                  updatedAt: new Date().toISOString(),
                }
              }
            })
            
            return NextResponse.json({
              ...payment,
              status: newStatus,
            })
          }
        }
      } catch (mpError) {
        console.error('Error checking Mercado Pago status:', mpError)
        // Continue with local payment status if MP check fails
      }
    }

    // Check if PIX payment has expired
    if (payment.method === 'PIX' && payment.status === 'PENDING' && payment.expiresAt && new Date() > payment.expiresAt) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'EXPIRED',
          failedAt: new Date(),
          failureReason: 'Payment expired'
        }
      })
      
      return NextResponse.json({
        ...payment,
        status: 'EXPIRED',
        failedAt: new Date(),
        failureReason: 'Payment expired'
      })
    }

    // Always ensure response includes essential fields
    const response = {
      ...payment,
      // Ensure these fields are always present for frontend
      id: payment.id,
      status: payment.status,
      credits: payment.credits,
      amount: payment.amount,
      userId: payment.userId,
    }
    
    console.log(`📤 [PAYMENT STATUS] Returning payment status for ${payment.id}: ${payment.status} (${payment.credits} credits)`)

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}