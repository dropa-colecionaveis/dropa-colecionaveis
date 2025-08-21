import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emailVerificationService } from '@/lib/email-verification'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.STRICT)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get IP and user agent for logging
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip
    const userAgent = req.headers.get('user-agent')

    // Create verification token
    const result = await emailVerificationService.generateEmailVerificationToken(
      session.user.id,
      ip || undefined,
      userAgent || undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    // Log security event
    console.log(`📧 Verification email sent to user ${session.user.id} from IP ${ip}`)

    return NextResponse.json({
      success: true,
      message: result.message,
      // Remove token from response in production
      ...(process.env.NODE_ENV === 'development' && { token: result.token })
    })

  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}