import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/admin-auth'

interface EnvironmentVariable {
  key: string
  isSet: boolean
  isRequired: boolean
  category: string
  description: string
  value?: string
  isSecret: boolean
}

interface EnvironmentValidation {
  isValid: boolean
  totalVariables: number
  setVariables: number
  missingRequired: number
  missingOptional: number
  securityIssues: string[]
  variables: EnvironmentVariable[]
  environment: string
  nodeVersion: string
  nextVersion: string
  databaseStatus: string
  redisStatus?: string
}

const REQUIRED_ENV_VARS: Omit<EnvironmentVariable, 'isSet' | 'value'>[] = [
  // Database
  {
    key: 'DATABASE_URL',
    isRequired: true,
    category: 'database',
    description: 'Connection string for PostgreSQL database',
    isSecret: true
  },
  {
    key: 'DIRECT_URL',
    isRequired: false,
    category: 'database',
    description: 'Direct connection URL for database migrations',
    isSecret: true
  },

  // Authentication
  {
    key: 'NEXTAUTH_SECRET',
    isRequired: true,
    category: 'auth',
    description: 'Secret for NextAuth.js encryption',
    isSecret: true
  },
  {
    key: 'NEXTAUTH_URL',
    isRequired: true,
    category: 'auth',
    description: 'Base URL for authentication callbacks',
    isSecret: false
  },
  {
    key: 'GOOGLE_CLIENT_ID',
    isRequired: false,
    category: 'auth',
    description: 'Google OAuth client ID',
    isSecret: false
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    isRequired: false,
    category: 'auth',
    description: 'Google OAuth client secret',
    isSecret: true
  },

  // Payment
  {
    key: 'STRIPE_SECRET_KEY',
    isRequired: false,
    category: 'payment',
    description: 'Stripe secret key for payments',
    isSecret: true
  },
  {
    key: 'STRIPE_PUBLISHABLE_KEY',
    isRequired: false,
    category: 'payment',
    description: 'Stripe publishable key',
    isSecret: false
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    isRequired: false,
    category: 'payment',
    description: 'Stripe webhook endpoint secret',
    isSecret: true
  },

  // Email
  {
    key: 'EMAIL_SERVER',
    isRequired: false,
    category: 'email',
    description: 'SMTP server for sending emails',
    isSecret: true
  },
  {
    key: 'EMAIL_FROM',
    isRequired: false,
    category: 'email',
    description: 'From address for outgoing emails',
    isSecret: false
  },

  // Storage
  {
    key: 'CLOUDINARY_CLOUD_NAME',
    isRequired: false,
    category: 'storage',
    description: 'Cloudinary cloud name for image uploads',
    isSecret: false
  },
  {
    key: 'CLOUDINARY_API_KEY',
    isRequired: false,
    category: 'storage',
    description: 'Cloudinary API key',
    isSecret: false
  },
  {
    key: 'CLOUDINARY_API_SECRET',
    isRequired: false,
    category: 'storage',
    description: 'Cloudinary API secret',
    isSecret: true
  },

  // Security
  {
    key: 'ENCRYPTION_KEY',
    isRequired: false,
    category: 'security',
    description: 'Key for encrypting sensitive data',
    isSecret: true
  },
  {
    key: 'JWT_SECRET',
    isRequired: false,
    category: 'security',
    description: 'Secret for JWT token signing',
    isSecret: true
  },

  // API
  {
    key: 'API_SECRET_KEY',
    isRequired: false,
    category: 'api',
    description: 'Secret key for API authentication',
    isSecret: true
  },

  // System Configuration  
  {
    key: 'NODE_ENV',
    isRequired: false,
    category: 'system',
    description: 'Node.js environment (development, production)',
    isSecret: false
  },
  {
    key: 'PORT',
    isRequired: false,
    category: 'system',
    description: 'Port for the application to run on',
    isSecret: false
  }
]

async function checkDatabaseConnection(): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    return 'connected'
  } catch (error) {
    console.error('Database connection error:', error)
    return 'disconnected'
  }
}

function validateEnvironmentVariables(): {
  variables: EnvironmentVariable[]
  securityIssues: string[]
} {
  const variables: EnvironmentVariable[] = []
  const securityIssues: string[] = []

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.key]
    const isSet = Boolean(value)

    variables.push({
      ...envVar,
      isSet,
      value: isSet ? value : undefined
    })

    // Check for security issues
    if (isSet && envVar.isSecret) {
      // Skip length check for URLs as they have different security requirements
      if (value && !envVar.key.includes('URL') && value.length < 32) {
        securityIssues.push(`${envVar.key}: Secret value is too short (< 32 characters)`)
      }
      if (value && value.includes('localhost') && process.env.NODE_ENV === 'production') {
        securityIssues.push(`${envVar.key}: Contains localhost in production environment`)
      }
      if (value && (value.includes('password123') || value.includes('secret123') || value.includes('test123'))) {
        securityIssues.push(`${envVar.key}: Contains weak/default values`)
      }
      // Specific checks for database URLs
      if (envVar.key.includes('DATABASE_URL') && value) {
        if (value.includes('@localhost') && process.env.NODE_ENV === 'production') {
          securityIssues.push(`${envVar.key}: Using localhost database in production`)
        }
        if (value.includes('password=') && value.match(/password=(\w{1,8})/)) {
          securityIssues.push(`${envVar.key}: Database password appears to be weak`)
        }
      }
    }
  }

  // Check for development values in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXTAUTH_URL?.includes('localhost')) {
      securityIssues.push('NEXTAUTH_URL: Using localhost in production')
    }
    if (process.env.DATABASE_URL?.includes('localhost')) {
      securityIssues.push('DATABASE_URL: Using localhost in production')
    }
  }

  return { variables, securityIssues }
}

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { variables, securityIssues } = validateEnvironmentVariables()
    const databaseStatus = await checkDatabaseConnection()

    const setVariables = variables.filter(v => v.isSet).length
    const missingRequired = variables.filter(v => !v.isSet && v.isRequired).length
    const missingOptional = variables.filter(v => !v.isSet && !v.isRequired).length

    const validation: EnvironmentValidation = {
      isValid: missingRequired === 0 && securityIssues.length === 0 && databaseStatus === 'connected',
      totalVariables: variables.length,
      setVariables,
      missingRequired,
      missingOptional,
      securityIssues,
      variables,
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      nextVersion: process.env.npm_package_dependencies_next || 'unknown',
      databaseStatus
    }

    return NextResponse.json(validation)
  } catch (error) {
    console.error('Environment validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})