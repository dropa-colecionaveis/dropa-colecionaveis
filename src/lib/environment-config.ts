// Environment Configuration
// Centralizes environment-specific configurations

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isTest = process.env.NODE_ENV === 'test'

export const environmentConfig = {
  // Logging configuration
  logging: {
    level: isProduction ? 'error' : 'debug',
    enableConsole: !isProduction,
    enableFileLogging: isProduction,
    sensitiveDataMask: isProduction
  },

  // Security settings
  security: {
    requireHttps: isProduction,
    enableCORS: isDevelopment,
    rateLimitStrict: isProduction,
    showStackTrace: isDevelopment,
    enableDebugEndpoints: isDevelopment
  },

  // Database settings
  database: {
    connectionPoolSize: isProduction ? 20 : 5,
    enableLogging: isDevelopment,
    enableSlowQueryLog: !isProduction,
    connectionTimeout: isProduction ? 10000 : 5000
  },

  // Feature flags
  features: {
    enableRegistration: process.env.ENABLE_REGISTRATION !== 'false',
    enableMarketplace: process.env.ENABLE_MARKETPLACE !== 'false', 
    enableAchievements: process.env.ENABLE_ACHIEVEMENTS !== 'false',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    enableDevTools: isDevelopment
  },

  // API settings
  api: {
    timeout: isProduction ? 30000 : 10000,
    retryAttempts: isProduction ? 3 : 1,
    enableRequestLogging: !isProduction,
    enableResponseCaching: isProduction
  },

  // Payment settings
  payments: {
    useTestCredentials: isDevelopment,
    enableWebhookValidation: isProduction,
    timeout: 15000
  },

  // File upload settings
  uploads: {
    maxFileSize: isProduction ? 5 * 1024 * 1024 : 10 * 1024 * 1024, // 5MB prod, 10MB dev
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    enableVirusScan: isProduction,
    storeLocal: isDevelopment
  },

  // Email settings
  email: {
    enableSending: isProduction || process.env.ENABLE_EMAIL === 'true',
    useTestMode: isDevelopment,
    enablePreview: isDevelopment
  },

  // Monitoring
  monitoring: {
    enableMetrics: isProduction,
    enableTracing: isProduction,
    enableHealthChecks: true,
    metricsInterval: 60000 // 1 minute
  }
}

// Environment validation
export function validateEnvironment() {
  const errors: string[] = []
  const warnings: string[] = []

  // Production-specific validations
  if (isProduction) {
    if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
      errors.push('NEXTAUTH_URL must use HTTPS in production')
    }

    if (!process.env.DATABASE_URL?.startsWith('postgres://') && !process.env.DATABASE_URL?.startsWith('postgresql://')) {
      warnings.push('Consider using PostgreSQL in production')
    }

    if (process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith('TEST-')) {
      errors.push('Cannot use test credentials in production')
    }

    if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
      warnings.push('MERCADO_PAGO_WEBHOOK_SECRET is highly recommended for production')
    }
  }

  // Development-specific validations
  if (isDevelopment) {
    if (process.env.NEXTAUTH_URL?.startsWith('https://') && !process.env.NEXTAUTH_URL.includes('localhost')) {
      warnings.push('Using HTTPS URL in development - make sure certificates are properly configured')
    }
  }

  return { errors, warnings }
}

// Helper functions
export function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL as any
  }
  return environmentConfig.logging.level as any
}

export function shouldShowSensitiveData(): boolean {
  return isDevelopment && process.env.SHOW_SENSITIVE_DATA === 'true'
}

export function getMaxRequestsPerMinute(): number {
  return isProduction ? 60 : 300 // Stricter in production
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required')
  }
  
  // In development, show which database we're connecting to
  if (isDevelopment) {
    console.log(`🗄️ Connecting to database: ${url.replace(/:[^:@]*@/, ':***@')}`)
  }
  
  return url
}

// Export current environment info
export const currentEnvironment = {
  name: process.env.NODE_ENV || 'development',
  isDevelopment,
  isProduction,
  isTest,
  nodeVersion: process.version,
  timestamp: new Date().toISOString()
}