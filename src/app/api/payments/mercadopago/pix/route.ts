import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Direct Mercado Pago integration to avoid import issues
const { MercadoPagoConfig, Payment } = require('mercadopago')

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  }
})

const payment = new Payment(client)

// Credit packages now loaded dynamically from database

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const { checkRateLimit } = await import('@/lib/rate-limit')

    console.log('🔥 PIX API called')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session')
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

    // CSRF protection for payment operations
    const { validateCSRFToken } = await import('@/lib/csrf-protection')
    const csrfValidation = await validateCSRFToken(req, authOptions, {
      consumeToken: true, // One-time use for payment operations
      strictSessionCheck: false // Relaxed session check for payments
    })

    if (!csrfValidation.isValid) {
      return csrfValidation.response!
    }

    console.log('✅ User authenticated, session validated, and CSRF protected:', session.user.id)

    // 🛡️ RATE LIMITING CHECK
    const rateLimitResult = checkRateLimit(session.user.id, 'payment_create')

    if (!rateLimitResult.allowed) {
      console.warn(`⚠️ Rate limit exceeded for user ${session.user.id}`)
      return NextResponse.json(
        {
          error: 'Too many payment attempts',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Validate and sanitize input with enhanced security
    const { inputValidator } = await import('@/lib/input-validator')
    const { securityLogger } = await import('@/lib/security-logger')

    let body
    let validationResult

    try {
      body = await req.json()
      console.log('📦 Request body received')

      // Validate payment data with enhanced security
      validationResult = inputValidator.validatePaymentData(body)

      if (!validationResult.isValid) {
        // Log validation failure
        await securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          userId: session.user.id,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
          endpoint: '/api/payments/mercadopago/pix',
          method: 'POST',
          description: `PIX payment validation failed: ${validationResult.errors.join(', ')}`,
          metadata: {
            validationErrors: validationResult.errors,
            providedFields: Object.keys(body)
          }
        })

        console.log('❌ Input validation failed:', validationResult.errors)
        return NextResponse.json(
          {
            error: 'Invalid payment data',
            details: validationResult.errors
          },
          { status: 400 }
        )
      }

      // Use sanitized data
      body = validationResult.sanitizedData

      // Check for suspicious patterns
      await inputValidator.checkSuspiciousPatterns(body, req, session.user.id)

    } catch (error) {
      // Log parsing/security error
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        userId: session.user.id,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: '/api/payments/mercadopago/pix',
        method: 'POST',
        description: `PIX request parsing/validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      })

      console.log('❌ Request parsing/validation error:', error)
      return NextResponse.json(
        { error: 'Invalid request format or security violation' },
        { status: 400 }
      )
    }

    if (!body.packageId) {
      console.log('❌ Missing package ID')
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Get credit package details from database
    console.log('🎁 Looking for package ID:', body.packageId)
    
    let creditPackage = null
    
    // Se for um ID numérico, buscar por ordem (compatibilidade)
    if (typeof body.packageId === 'number') {
      const packages = await prisma.creditPackage.findMany({
        where: { isActive: true },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      })
      creditPackage = packages[body.packageId - 1] // Index baseado em 1
    } else {
      // Se for string, buscar por ID direto
      creditPackage = await prisma.creditPackage.findUnique({
        where: { 
          id: body.packageId,
          isActive: true 
        }
      })
    }
    
    if (!creditPackage) {
      console.log('❌ Invalid package ID:', body.packageId)
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      )
    }
    console.log('✅ Credit package found:', creditPackage)

    // Get user details
    console.log('👤 Looking for user:', session.user.id)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      console.log('❌ User not found:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    console.log('✅ User found:', user.email)

    // Generate unique external reference
    const externalReference = `credit_${creditPackage.id}_${Date.now()}_${user.id.slice(-8)}`
    console.log('🔗 External reference:', externalReference)

    // Create PIX payment directly with Mercado Pago
    console.log('💰 Creating PIX payment...')
    
    const paymentData = {
      transaction_amount: creditPackage.price,
      description: `${creditPackage.credits} créditos - Colecionáveis Platform`,
      payment_method_id: 'pix',
      external_reference: externalReference,
      // Enable webhook in production
      ...(process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost') && {
        notification_url: `${process.env.NEXTAUTH_URL}/api/payments/mercadopago/webhook`,
      }),
      payer: {
        email: user.email,
      },
    }

    console.log('📤 Sending to Mercado Pago:', JSON.stringify(paymentData, null, 2))
    const response = await payment.create({ body: paymentData })
    
    if (!response) {
      console.error('❌ No response from Mercado Pago')
      throw new Error('No response from Mercado Pago')
    }

    console.log('✅ PIX payment created:', {
      id: response.id,
      status: response.status,
      hasQrCode: !!response.point_of_interaction?.transaction_data?.qr_code,
      hasQrCodeBase64: !!response.point_of_interaction?.transaction_data?.qr_code_base64,
    })

    const pixPayment = {
      id: response.id!.toString(),
      status: response.status!,
      qrCode: response.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      copyPasteCode: response.point_of_interaction?.transaction_data?.qr_code || '',
      expirationDate: response.date_of_expiration || '',
    }

    // Save payment record in database
    console.log('💾 Saving payment to database...')
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: user.id,
        externalId: pixPayment.id,
        status: 'PENDING',
        method: 'PIX',
        amount: creditPackage.price,
        credits: creditPackage.credits,
        packageId: body.packageId, // Manter compatibilidade
        creditPackageId: creditPackage.id, // Novo campo para referência
        pixQrCode: pixPayment.qrCode,
        pixQrCodeBase64: pixPayment.qrCodeBase64,
        pixCopyPaste: pixPayment.copyPasteCode,
        expiresAt: pixPayment.expirationDate ? new Date(pixPayment.expirationDate) : new Date(Date.now() + 15 * 60 * 1000), // 15 minutes default
        mercadoPagoData: {
          originalResponse: {
            id: pixPayment.id,
            status: pixPayment.status,
          }
        }
      }
    })

    const apiResponse = {
      success: true,
      paymentId: paymentRecord.id,
      status: 'PENDING',
      pixQrCode: pixPayment.qrCode,
      pixQrCodeBase64: pixPayment.qrCodeBase64,
      pixCopyPaste: pixPayment.copyPasteCode,
      expirationDate: pixPayment.expirationDate,
      amount: creditPackage.price,
      credits: creditPackage.credits,
      message: 'PIX payment created successfully'
    }

    // Log successful payment creation
    await securityLogger.logPayment(
      true,
      user.id,
      creditPackage.price,
      'PIX',
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      {
        paymentId: paymentRecord.id,
        externalId: pixPayment.id,
        packageId: body.packageId,
        credits: creditPackage.credits,
        userAgent: req.headers.get('user-agent')
      }
    )

    console.log(`✅ PIX payment created for user ${user.id}: ${paymentRecord.id}`)

    return NextResponse.json(apiResponse, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    })

  } catch (error) {
    // Log payment failure
    const { authOptions } = await import('@/lib/auth')
    const { securityLogger } = await import('@/lib/security-logger')
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      await securityLogger.logPayment(
        false,
        session.user.id,
        0, // Amount unknown in error case
        'PIX',
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          userAgent: req.headers.get('user-agent')
        }
      )
    }

    console.error('💥 PIX payment creation error:', error)
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    )
  }
}