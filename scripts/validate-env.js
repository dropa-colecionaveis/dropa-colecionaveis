#!/usr/bin/env node

// Environment Variables Validation Script
// Run this script to validate your environment configuration

const fs = require('fs')
const path = require('path')

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function printHeader(text) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'))
  console.log(colorize(text, 'cyan'))
  console.log(colorize('='.repeat(60), 'cyan') + '\n')
}

function printSuccess(text) {
  console.log(colorize('✅ ' + text, 'green'))
}

function printError(text) {
  console.log(colorize('❌ ' + text, 'red'))
}

function printWarning(text) {
  console.log(colorize('⚠️  ' + text, 'yellow'))
}

function printInfo(text) {
  console.log(colorize('ℹ️  ' + text, 'blue'))
}

// Load environment variables
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {}
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = {}

  envContent.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
      }
    }
  })

  return envVars
}

// Validation functions
function validateRequired(envVars, errors, warnings) {
  const required = [
    'NODE_ENV',
    'DATABASE_URL',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET',
    'MERCADO_PAGO_ACCESS_TOKEN',
    'MERCADO_PAGO_PUBLIC_KEY',
    'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY'
  ]

  required.forEach(key => {
    if (!envVars[key]) {
      errors.push(`Missing required variable: ${key}`)
    }
  })
}

function validateFormats(envVars, errors, warnings) {
  // Validate NODE_ENV
  if (envVars.NODE_ENV && !['development', 'production', 'test'].includes(envVars.NODE_ENV)) {
    errors.push('NODE_ENV must be "development", "production", or "test"')
  }

  // Validate URLs
  if (envVars.NEXTAUTH_URL) {
    try {
      new URL(envVars.NEXTAUTH_URL)
      if (envVars.NODE_ENV === 'production' && !envVars.NEXTAUTH_URL.startsWith('https://')) {
        errors.push('NEXTAUTH_URL must use HTTPS in production')
      }
    } catch {
      errors.push('NEXTAUTH_URL must be a valid URL')
    }
  }

  // Validate database URL
  if (envVars.DATABASE_URL) {
    const validPrefixes = ['postgresql://', 'postgres://', 'mysql://', 'sqlite:', 'file:']
    if (!validPrefixes.some(prefix => envVars.DATABASE_URL.startsWith(prefix))) {
      errors.push('DATABASE_URL format is invalid')
    }
  }

  // Validate Mercado Pago tokens
  if (envVars.MERCADO_PAGO_ACCESS_TOKEN) {
    if (!/^(TEST-|APP_USR-)?[a-zA-Z0-9_-]{32,}$/.test(envVars.MERCADO_PAGO_ACCESS_TOKEN)) {
      errors.push('MERCADO_PAGO_ACCESS_TOKEN format is invalid')
    }

    if (envVars.NODE_ENV === 'production' && envVars.MERCADO_PAGO_ACCESS_TOKEN.startsWith('TEST-')) {
      errors.push('Cannot use TEST credentials in production')
    }
  }

  // Validate secret lengths
  if (envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long')
  }

}

function validateSecurity(envVars, errors, warnings) {
  // Check for weak secrets
  const secrets = ['NEXTAUTH_SECRET', 'MERCADO_PAGO_WEBHOOK_SECRET']
  
  secrets.forEach(secret => {
    if (envVars[secret]) {
      const value = envVars[secret].toLowerCase()
      if (value.includes('password') || value.includes('123') || value.includes('secret')) {
        warnings.push(`${secret} appears to be weak - consider using a stronger random value`)
      }
    }
  })

  // Check for development values in production
  if (envVars.NODE_ENV === 'production') {
    const dangerousValues = ['localhost', '127.0.0.1', 'development', 'test', 'example.com']
    const envString = JSON.stringify(envVars).toLowerCase()
    
    dangerousValues.forEach(value => {
      if (envString.includes(value)) {
        warnings.push(`Production environment contains development value: "${value}"`)
      }
    })
  }

  // Check client-side variables for sensitive data
  Object.keys(envVars).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      const sensitiveKeywords = ['secret', 'password', 'private']
      const keyLower = key.toLowerCase()
      
      sensitiveKeywords.forEach(keyword => {
        if (keyLower.includes(keyword) && key !== 'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY') {
          warnings.push(`Client-side variable ${key} may contain sensitive data`)
        }
      })
    }
  })
}

function validateConsistency(envVars, errors, warnings) {
  // Check Mercado Pago token consistency
  const hasTestToken = envVars.MERCADO_PAGO_ACCESS_TOKEN?.startsWith('TEST-')
  const hasTestPublicKey = envVars.MERCADO_PAGO_PUBLIC_KEY?.startsWith('TEST-')
  
  if (hasTestToken !== hasTestPublicKey) {
    errors.push('Mercado Pago access token and public key must both be test or production credentials')
  }

  // Check if public keys match
  if (envVars.MERCADO_PAGO_PUBLIC_KEY && envVars.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
    if (envVars.MERCADO_PAGO_PUBLIC_KEY !== envVars.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
      errors.push('MERCADO_PAGO_PUBLIC_KEY and NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY must match')
    }
  }

  // Check OAuth configuration
  const hasGoogleId = !!envVars.GOOGLE_CLIENT_ID
  const hasGoogleSecret = !!envVars.GOOGLE_CLIENT_SECRET
  
  if (hasGoogleId !== hasGoogleSecret) {
    warnings.push('Google OAuth requires both CLIENT_ID and CLIENT_SECRET')
  }

  // Check SMTP configuration
  const smtpFields = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD']
  const configuredSmtp = smtpFields.filter(field => envVars[field])
  
  if (configuredSmtp.length > 0 && configuredSmtp.length < smtpFields.length) {
    warnings.push('Partial SMTP configuration detected - all SMTP fields should be configured together')
  }
}

function generateSecureSecret(length = 64) {
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('hex')
}

function main() {
  printHeader('🔧 Environment Variables Validation')

  const projectRoot = path.join(__dirname, '..')
  const envPath = path.join(projectRoot, '.env')
  const envExamplePath = path.join(projectRoot, '.env.example')

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    printError('.env file not found')
    
    if (fs.existsSync(envExamplePath)) {
      printInfo('Copy .env.example to .env and configure your values:')
      printInfo('cp .env.example .env')
    }
    
    process.exit(1)
  }

  printInfo(`Loading environment from: ${envPath}`)

  // Load environment variables
  const envVars = loadEnvFile(envPath)
  const errors = []
  const warnings = []

  // Run validations
  validateRequired(envVars, errors, warnings)
  validateFormats(envVars, errors, warnings)
  validateSecurity(envVars, errors, warnings)
  validateConsistency(envVars, errors, warnings)

  // Print results
  printHeader('📋 Validation Results')

  if (errors.length === 0) {
    printSuccess('All required validations passed!')
  } else {
    printError(`Found ${errors.length} error(s):`)
    errors.forEach(error => printError(`  ${error}`))
  }

  if (warnings.length > 0) {
    console.log('')
    printWarning(`Found ${warnings.length} warning(s):`)
    warnings.forEach(warning => printWarning(`  ${warning}`))
  }

  // Environment summary
  printHeader('📊 Environment Summary')
  printInfo(`Environment: ${envVars.NODE_ENV || 'not set'}`)
  printInfo(`Database: ${envVars.DATABASE_URL ? 'configured' : 'not configured'}`)
  printInfo(`Authentication: ${envVars.NEXTAUTH_URL ? 'configured' : 'not configured'}`)
  printInfo(`Payments: ${envVars.MERCADO_PAGO_ACCESS_TOKEN ? 'configured' : 'not configured'}`)
  printInfo(`Backups: not configured (optional)`)
  printInfo(`Email: ${envVars.SMTP_HOST ? 'configured' : 'not configured'}`)
  printInfo(`OAuth: ${envVars.GOOGLE_CLIENT_ID || envVars.FACEBOOK_CLIENT_ID ? 'configured' : 'not configured'}`)

  // Generate secrets if needed
  if (errors.some(error => error.includes('SECRET') || error.includes('KEY'))) {
    printHeader('🔐 Generated Secure Secrets')
    printInfo('Copy these secure secrets to your .env file:')
    console.log('')
    console.log(colorize(`NEXTAUTH_SECRET="${generateSecureSecret(32)}"`, 'magenta'))
    console.log(colorize(`MERCADO_PAGO_WEBHOOK_SECRET="${generateSecureSecret(24)}"`, 'magenta'))
  }

  // Exit with appropriate code
  if (errors.length > 0) {
    printHeader('❌ Validation Failed')
    printError('Fix the errors above before running the application')
    process.exit(1)
  } else {
    printHeader('✅ Validation Successful')
    printSuccess('Environment is properly configured!')
    
    if (warnings.length > 0) {
      printWarning('Consider addressing the warnings for better security')
    }
    
    process.exit(0)
  }
}

// Run validation
main()