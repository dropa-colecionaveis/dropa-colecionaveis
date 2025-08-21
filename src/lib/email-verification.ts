import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface EmailVerificationResult {
  success: boolean
  message: string
  token?: string
  error?: string
}

export interface VerifyTokenResult {
  success: boolean
  message: string
  userId?: string
  error?: string
}

class EmailVerificationService {
  // Generate a secure verification token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Create verification token for user
  async createVerificationToken(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<EmailVerificationResult> {
    try {
      // Check if user exists and is not already verified
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          emailVerified: true,
          name: true
        }
      })

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          error: 'USER_NOT_FOUND'
        }
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email já verificado',
          error: 'ALREADY_VERIFIED'
        }
      }

      // Delete any existing tokens for this user
      await prisma.emailVerificationToken.deleteMany({
        where: { userId }
      })

      // Create new token (expires in 24 hours)
      const token = this.generateToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await prisma.emailVerificationToken.create({
        data: {
          userId,
          token,
          expiresAt,
          ipAddress,
          userAgent
        }
      })

      console.log(`📧 Email verification token created for user ${userId}`)

      // In production, send email here
      await this.sendVerificationEmail(user.email, user.name, token)

      return {
        success: true,
        message: 'Token de verificação enviado para seu email',
        token: token // Remove this in production
      }

    } catch (error) {
      console.error('Error creating verification token:', error)
      return {
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR'
      }
    }
  }

  // Verify token and mark email as verified
  async verifyToken(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerifyTokenResult> {
    try {
      // Find token
      const verificationToken = await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              emailVerified: true,
              name: true
            }
          }
        }
      })

      if (!verificationToken) {
        return {
          success: false,
          message: 'Token inválido ou não encontrado',
          error: 'INVALID_TOKEN'
        }
      }

      // Check if token is expired
      if (verificationToken.expiresAt < new Date()) {
        // Delete expired token
        await prisma.emailVerificationToken.delete({
          where: { id: verificationToken.id }
        })

        return {
          success: false,
          message: 'Token expirado. Solicite um novo token de verificação.',
          error: 'TOKEN_EXPIRED'
        }
      }

      // Check if token already used
      if (verificationToken.usedAt) {
        return {
          success: false,
          message: 'Token já utilizado',
          error: 'TOKEN_ALREADY_USED'
        }
      }

      // Check if user is already verified
      if (verificationToken.user.emailVerified) {
        // Mark token as used
        await prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { usedAt: new Date() }
        })

        return {
          success: false,
          message: 'Email já verificado',
          error: 'ALREADY_VERIFIED'
        }
      }

      // Verify email and mark token as used
      await prisma.$transaction(async (tx) => {
        // Update user
        await tx.user.update({
          where: { id: verificationToken.userId },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date()
          }
        })

        // Mark token as used
        await tx.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { 
            usedAt: new Date(),
            ipAddress,
            userAgent
          }
        })
      })

      console.log(`✅ Email verified for user ${verificationToken.userId}`)

      return {
        success: true,
        message: 'Email verificado com sucesso!',
        userId: verificationToken.userId
      }

    } catch (error) {
      console.error('Error verifying token:', error)
      return {
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR'
      }
    }
  }

  // Resend verification email
  async resendVerificationEmail(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<EmailVerificationResult> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { 
          id: true, 
          email: true, 
          emailVerified: true,
          name: true
        }
      })

      if (!user) {
        return {
          success: false,
          message: 'Email não encontrado',
          error: 'EMAIL_NOT_FOUND'
        }
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email já verificado',
          error: 'ALREADY_VERIFIED'
        }
      }

      // Check rate limiting (max 3 emails per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentTokens = await prisma.emailVerificationToken.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: oneHourAgo
          }
        }
      })

      if (recentTokens >= 3) {
        return {
          success: false,
          message: 'Muitas tentativas. Tente novamente em 1 hora.',
          error: 'RATE_LIMIT_EXCEEDED'
        }
      }

      // Create new verification token
      return await this.createVerificationToken(user.id, ipAddress, userAgent)

    } catch (error) {
      console.error('Error resending verification email:', error)
      return {
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR'
      }
    }
  }

  // Send verification email (placeholder - implement with real email service)
  private async sendVerificationEmail(email: string, name: string | null, token: string) {
    try {
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
      
      console.log('📧 Sending verification email:')
      console.log(`To: ${email}`)
      console.log(`Name: ${name || 'Usuário'}`)
      console.log(`Verification URL: ${verificationUrl}`)
      
      // TODO: Implement actual email sending
      // Example with SendGrid:
      /*
      const msg = {
        to: email,
        from: 'noreply@colecionaveis.com',
        subject: 'Verificação de Email - Colecionáveis Platform',
        html: `
          <h2>Verificação de Email</h2>
          <p>Olá ${name || 'Usuário'},</p>
          <p>Clique no link abaixo para verificar seu email:</p>
          <a href="${verificationUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Verificar Email
          </a>
          <p>Este link expira em 24 horas.</p>
          <p>Se você não criou uma conta conosco, ignore este email.</p>
        `
      }
      await sgMail.send(msg)
      */

    } catch (error) {
      console.error('Error sending verification email:', error)
      throw error
    }
  }

  // Check if user needs email verification
  async needsVerification(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          emailVerified: true,
          provider: true // OAuth users don't need email verification
        }
      })

      if (!user) return false
      
      // OAuth users are automatically verified
      if (user.provider && user.provider !== 'credentials') {
        return false
      }

      return !user.emailVerified

    } catch (error) {
      console.error('Error checking verification status:', error)
      return false
    }
  }

  // Clean up expired tokens (for maintenance)
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.emailVerificationToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} expired verification tokens`)
      return result.count

    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
      return 0
    }
  }

  // Get verification stats (for admin)
  async getVerificationStats() {
    try {
      const [
        totalUsers,
        verifiedUsers,
        pendingTokens,
        expiredTokens
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.emailVerificationToken.count({
          where: {
            usedAt: null,
            expiresAt: { gt: new Date() }
          }
        }),
        prisma.emailVerificationToken.count({
          where: {
            usedAt: null,
            expiresAt: { lt: new Date() }
          }
        })
      ])

      return {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        pendingTokens,
        expiredTokens
      }

    } catch (error) {
      console.error('Error getting verification stats:', error)
      return null
    }
  }
}

// Export singleton instance
export const emailVerificationService = new EmailVerificationService()