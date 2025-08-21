import { NextRequest, NextResponse } from 'next/server'
import { emailVerificationService } from '@/lib/email-verification'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export async function POST(req: NextRequest) {
  try {
    // Apply strict rate limiting for resend requests
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.STRICT)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Get IP and user agent for logging
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip
    const userAgent = req.headers.get('user-agent')

    // Resend verification email
    const result = await emailVerificationService.resendVerificationEmail(
      email,
      ip || undefined,
      userAgent || undefined
    )

    if (!result.success) {
      // Log failed resend attempt
      console.warn(`❌ Failed verification resend attempt for ${email} from IP ${ip}: ${result.error}`)
      
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    // Log successful resend
    console.log(`📧 Verification email resent to ${email} from IP ${ip}`)

    return NextResponse.json({
      success: true,
      message: result.message
    })

  } catch (error) {
    console.error('Error resending verification email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}