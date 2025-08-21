// Environment Variables Validator
// Validates and sanitizes environment variables on application startup

interface EnvConfig {
  // Required variables
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL: string
  NEXTAUTH_URL: string
  NEXTAUTH_SECRET: string
  
  // Mercado Pago (required)
  MERCADO_PAGO_ACCESS_TOKEN: string
  MERCADO_PAGO_PUBLIC_KEY: string
  NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: string
  
  // Security (optional - no backup system implemented)
  BACKUP_ENCRYPTION_KEY?: string
  
  // Optional but recommended
  MERCADO_PAGO_WEBHOOK_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  FACEBOOK_CLIENT_ID?: string
  FACEBOOK_CLIENT_SECRET?: string
  BACKUP_DIR?: string
  BACKUP_RETENTION_DAYS?: string
  
  // Email configuration (optional)
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  SMTP_FROM?: string
  
  // Monitoring and logging (optional)
  LOG_LEVEL?: string
  SENTRY_DSN?: string
  
  // Feature flags (optional)
  ENABLE_REGISTRATION?: string
  ENABLE_MARKETPLACE?: string
  ENABLE_ACHIEVEMENTS?: string
  MAINTENANCE_MODE?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config: Partial<EnvConfig>
}

class EnvironmentValidator {
  private errors: string[] = []
  private warnings: string[] = []

  // Validate all environment variables
  validate(): ValidationResult {
    this.errors = []
    this.warnings = []

    const config: Partial<EnvConfig> = {}

    // Validate required variables
    this.validateRequired(config)
    
    // Validate optional variables
    this.validateOptional(config)
    
    // Validate security requirements
    this.validateSecurity(config)
    
    // Validate configuration consistency
    this.validateConsistency(config)

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      config
    }
  }

  private validateRequired(config: Partial<EnvConfig>): void {
    // Node Environment
    const nodeEnv = process.env.NODE_ENV
    if (!nodeEnv || !['development', 'production', 'test'].includes(nodeEnv)) {
      this.errors.push('NODE_ENV must be set to "development", "production", or "test"')
    } else {
      config.NODE_ENV = nodeEnv as EnvConfig['NODE_ENV']
    }

    // Database URL
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      this.errors.push('DATABASE_URL is required')
    } else if (!this.isValidDatabaseUrl(databaseUrl)) {
      this.errors.push('DATABASE_URL format is invalid')
    } else {
      config.DATABASE_URL = databaseUrl
    }

    // NextAuth URL
    const nextAuthUrl = process.env.NEXTAUTH_URL
    if (!nextAuthUrl) {
      this.errors.push('NEXTAUTH_URL is required')
    } else if (!this.isValidUrl(nextAuthUrl)) {
      this.errors.push('NEXTAUTH_URL must be a valid URL')
    } else {
      config.NEXTAUTH_URL = nextAuthUrl
      
      // Security check for production
      if (config.NODE_ENV === 'production' && !nextAuthUrl.startsWith('https://')) {
        this.errors.push('NEXTAUTH_URL must use HTTPS in production')
      }
    }

    // NextAuth Secret
    const nextAuthSecret = process.env.NEXTAUTH_SECRET
    if (!nextAuthSecret) {
      this.errors.push('NEXTAUTH_SECRET is required')
    } else if (nextAuthSecret.length < 32) {
      this.errors.push('NEXTAUTH_SECRET must be at least 32 characters long')
    } else if (this.isWeakSecret(nextAuthSecret)) {
      this.errors.push('NEXTAUTH_SECRET is too weak. Use a strong, random secret.')
    } else {
      config.NEXTAUTH_SECRET = nextAuthSecret
    }

    // Mercado Pago Access Token
    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!mpAccessToken) {
      this.errors.push('MERCADO_PAGO_ACCESS_TOKEN is required')
    } else if (!this.isValidMercadoPagoToken(mpAccessToken)) {
      this.errors.push('MERCADO_PAGO_ACCESS_TOKEN format is invalid')
    } else {
      config.MERCADO_PAGO_ACCESS_TOKEN = mpAccessToken
      
      // Check if using test credentials in production
      if (config.NODE_ENV === 'production' && mpAccessToken.startsWith('TEST-')) {
        this.errors.push('Cannot use TEST credentials in production environment')
      }
    }

    // Mercado Pago Public Key
    const mpPublicKey = process.env.MERCADO_PAGO_PUBLIC_KEY
    if (!mpPublicKey) {
      this.errors.push('MERCADO_PAGO_PUBLIC_KEY is required')
    } else if (!this.isValidMercadoPagoToken(mpPublicKey)) {
      this.errors.push('MERCADO_PAGO_PUBLIC_KEY format is invalid')
    } else {
      config.MERCADO_PAGO_PUBLIC_KEY = mpPublicKey
    }

    // Next Public Mercado Pago Key (should match the public key)
    const nextPublicMpKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
    if (!nextPublicMpKey) {
      this.errors.push('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY is required')
    } else if (nextPublicMpKey !== mpPublicKey) {
      this.errors.push('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY must match MERCADO_PAGO_PUBLIC_KEY')
    } else {
      config.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = nextPublicMpKey
    }

    // Backup Encryption Key (optional - no backup system implemented)
    const backupKey = process.env.BACKUP_ENCRYPTION_KEY
    if (backupKey) {
      if (backupKey.length < 32) {
        this.warnings.push('BACKUP_ENCRYPTION_KEY should be at least 32 characters long')
      } else if (this.isWeakSecret(backupKey)) {
        this.warnings.push('BACKUP_ENCRYPTION_KEY appears to be weak. Use a strong, random key.')
      } else {
        config.BACKUP_ENCRYPTION_KEY = backupKey
      }
    }
  }

  private validateOptional(config: Partial<EnvConfig>): void {
    // Webhook Secret
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
    if (webhookSecret) {
      if (webhookSecret.length < 16) {
        this.warnings.push('MERCADO_PAGO_WEBHOOK_SECRET should be at least 16 characters long')
      }
      config.MERCADO_PAGO_WEBHOOK_SECRET = webhookSecret
    } else if (config.NODE_ENV === 'production') {
      this.warnings.push('MERCADO_PAGO_WEBHOOK_SECRET is recommended for production')
    }

    // OAuth Providers
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (googleClientId && !googleClientSecret) {
      this.warnings.push('GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set')
    } else if (!googleClientId && googleClientSecret) {
      this.warnings.push('GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set')
    } else if (googleClientId && googleClientSecret) {
      config.GOOGLE_CLIENT_ID = googleClientId
      config.GOOGLE_CLIENT_SECRET = googleClientSecret
    }

    // Backup Configuration
    const backupDir = process.env.BACKUP_DIR
    if (backupDir) {
      config.BACKUP_DIR = backupDir
    } else {
      config.BACKUP_DIR = './backups'
      this.warnings.push('BACKUP_DIR not set, using default: ./backups')
    }

    const backupRetention = process.env.BACKUP_RETENTION_DAYS
    if (backupRetention) {
      const days = parseInt(backupRetention)
      if (isNaN(days) || days < 1) {
        this.warnings.push('BACKUP_RETENTION_DAYS must be a positive number')
      } else if (days > 365) {
        this.warnings.push('BACKUP_RETENTION_DAYS is very high (>365), consider reducing')
      }
      config.BACKUP_RETENTION_DAYS = backupRetention
    }

    // Email Configuration
    const smtpHost = process.env.SMTP_HOST
    if (smtpHost) {
      config.SMTP_HOST = smtpHost
      
      // If SMTP is configured, check other required fields
      if (!process.env.SMTP_PORT) {
        this.warnings.push('SMTP_PORT should be set when SMTP_HOST is configured')
      } else {
        config.SMTP_PORT = process.env.SMTP_PORT
      }
      
      if (!process.env.SMTP_USER) {
        this.warnings.push('SMTP_USER should be set when SMTP_HOST is configured')
      } else {
        config.SMTP_USER = process.env.SMTP_USER
      }
      
      if (!process.env.SMTP_PASSWORD) {
        this.warnings.push('SMTP_PASSWORD should be set when SMTP_HOST is configured')
      } else {
        config.SMTP_PASSWORD = process.env.SMTP_PASSWORD
      }
    } else if (config.NODE_ENV === 'production') {
      this.warnings.push('Email configuration (SMTP_*) is recommended for production')
    }

    // Feature Flags
    const featureFlags = [
      'ENABLE_REGISTRATION',
      'ENABLE_MARKETPLACE', 
      'ENABLE_ACHIEVEMENTS',
      'MAINTENANCE_MODE'
    ]

    for (const flag of featureFlags) {
      const value = process.env[flag]
      if (value && !['true', 'false'].includes(value.toLowerCase())) {
        this.warnings.push(`${flag} should be 'true' or 'false'`)
      }
    }
  }

  private validateSecurity(config: Partial<EnvConfig>): void {
    // Check for development values in production
    if (config.NODE_ENV === 'production') {
      const dangerousValues = [
        'localhost',
        '127.0.0.1',
        'development',
        'test',
        'example.com',
        'password123',
        'secret123',
        'admin'
      ]

      const envString = JSON.stringify(config).toLowerCase()
      for (const dangerous of dangerousValues) {
        if (envString.includes(dangerous)) {
          this.warnings.push(`Production environment contains development value: "${dangerous}"`)
        }
      }
    }

    // Check for exposed secrets in client-side variables
    const clientVars = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    const sensitiveKeywords = ['secret', 'password', 'private', 'key']
    
    for (const clientVar of clientVars) {
      const lowerVar = clientVar.toLowerCase()
      for (const keyword of sensitiveKeywords) {
        if (lowerVar.includes(keyword) && clientVar !== 'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY') {
          this.warnings.push(`Client-side variable ${clientVar} may contain sensitive data`)
        }
      }
    }

    // Check SSL configuration
    if (config.NODE_ENV === 'production' && config.NEXTAUTH_URL) {
      if (!config.NEXTAUTH_URL.startsWith('https://')) {
        this.errors.push('NEXTAUTH_URL must use HTTPS in production')
      }
    }
  }

  private validateConsistency(config: Partial<EnvConfig>): void {
    // Check if test and production tokens are mixed
    const hasTestToken = config.MERCADO_PAGO_ACCESS_TOKEN?.startsWith('TEST-')
    const hasTestPublicKey = config.MERCADO_PAGO_PUBLIC_KEY?.startsWith('TEST-')
    
    if (hasTestToken !== hasTestPublicKey) {
      this.errors.push('Mercado Pago access token and public key must both be test or production credentials')
    }

    // Check OAuth configuration consistency
    const hasGoogleId = !!config.GOOGLE_CLIENT_ID
    const hasGoogleSecret = !!config.GOOGLE_CLIENT_SECRET
    
    if (hasGoogleId !== hasGoogleSecret) {
      this.warnings.push('Google OAuth requires both CLIENT_ID and CLIENT_SECRET')
    }
  }

  // Utility validation methods
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private isValidDatabaseUrl(url: string): boolean {
    const validPrefixes = ['postgresql://', 'postgres://', 'mysql://', 'sqlite:', 'file:']
    return validPrefixes.some(prefix => url.startsWith(prefix))
  }

  private isValidMercadoPagoToken(token: string): boolean {
    // Basic format validation for Mercado Pago tokens
    return /^(TEST-|APP_USR-)?[a-zA-Z0-9_-]{32,}$/.test(token)
  }

  private isWeakSecret(secret: string): boolean {
    // Check for weak/common secrets
    const weakPatterns = [
      /^(123|abc|qwe|password|secret|admin)/i,
      /^(.)\1{10,}$/, // Repeated characters
      /^(.*)\1+$/, // Repeated patterns
    ]

    return weakPatterns.some(pattern => pattern.test(secret))
  }

  // Generate a secure random secret
  static generateSecureSecret(length: number = 64): string {
    const crypto = require('crypto')
    return crypto.randomBytes(length).toString('hex')
  }

  // Get environment setup instructions
  getSetupInstructions(): string {
    const environment = process.env.NODE_ENV || 'development'
    
    return `
🔧 ENVIRONMENT SETUP INSTRUCTIONS

Current Environment: ${environment}

1. Copy environment template:
   cp .env.example .env

2. Generate secure secrets:
   NEXTAUTH_SECRET: ${EnvironmentValidator.generateSecureSecret(32)}

3. Configure required variables:
   - DATABASE_URL: Your database connection string
   - NEXTAUTH_URL: Your application URL
   - MERCADO_PAGO_*: Your payment provider credentials

4. Set up optional services:
   - Email configuration (SMTP_*)
   - OAuth providers (GOOGLE_*, FACEBOOK_*)
   - Monitoring (SENTRY_DSN)

5. Validate configuration:
   npm run validate-env

⚠️ SECURITY NOTES:
- Never commit .env files to version control
- Use different secrets for each environment
- Rotate secrets regularly
- Use HTTPS in production
- Enable webhook verification
    `
  }
}

// Validate environment on module load
export function validateEnvironment(): ValidationResult {
  const validator = new EnvironmentValidator()
  const result = validator.validate()

  // Log results
  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:')
    result.errors.forEach(error => console.error(`  - ${error}`))
    
    if (process.env.NODE_ENV === 'production') {
      console.error('\n🚨 Cannot start application with invalid environment in production')
      process.exit(1)
    }
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment validation warnings:')
    result.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  if (result.isValid) {
    console.log('✅ Environment validation passed')
  }

  return result
}

// Export singleton validator
export const envValidator = new EnvironmentValidator()

// Validate on import (but allow override for testing)
if (process.env.NODE_ENV !== 'test') {
  validateEnvironment()
}