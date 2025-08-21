// Email verification functionality - DISABLED FOR BUILD COMPATIBILITY
export class EmailVerificationService {
  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  async generateEmailVerificationToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean
    token?: string
    message?: string
    error?: string
  }> {
    return {
      success: false,
      message: 'Email verification is disabled during build',
      error: 'FEATURE_DISABLED'
    }
  }

  async verifyEmailToken(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean
    userId?: string
    message?: string
    error?: string
  }> {
    return {
      success: false,
      message: 'Email verification is disabled during build',
      error: 'FEATURE_DISABLED'
    }
  }

  async resendVerificationEmail(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean
    message?: string
    error?: string
  }> {
    return {
      success: false,
      message: 'Email verification is disabled during build',
      error: 'FEATURE_DISABLED'
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    return 0
  }

  async getVerificationStats(): Promise<any> {
    return {
      totalTokens: 0,
      expiredTokens: 0,
      pendingVerifications: 0
    }
  }
}

export const emailVerificationService = new EmailVerificationService()