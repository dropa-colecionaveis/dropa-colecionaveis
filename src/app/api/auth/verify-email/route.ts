import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { emailVerificationService } = await import('@/lib/email-verification')
    const { applyRateLimit, RATE_LIMITS } = await import('@/lib/rate-limiter')
    
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.AUTH)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await req.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    // Get IP and user agent for logging
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip
    const userAgent = req.headers.get('user-agent')

    // Verify token
    const result = await emailVerificationService.verifyEmailToken(
      token,
      ip || undefined,
      userAgent || undefined
    )

    if (!result.success) {
      // Log failed verification attempt
      console.warn(`❌ Failed email verification attempt from IP ${ip}: ${result.error}`)
      
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    // Log successful verification
    console.log(`✅ Email verified for user ${result.userId} from IP ${ip}`)

    return NextResponse.json({
      success: true,
      message: result.message,
      userId: result.userId
    })

  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}