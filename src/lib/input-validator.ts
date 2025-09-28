import { NextRequest } from 'next/server'
import { securityLogger } from '@/lib/security-logger'

// Validation rules
export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'json'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  allowedValues?: any[]
  customValidator?: (value: any) => boolean
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData: any
}

export interface SuspiciousPattern {
  pattern: RegExp
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
}

class InputValidator {
  // Suspicious patterns to detect potential attacks
  private suspiciousPatterns: SuspiciousPattern[] = [
    // SQL Injection patterns
    {
      pattern: /(union|select|insert|update|delete|drop|alter|create|exec|execute)\s/i,
      severity: 'CRITICAL',
      description: 'SQL Injection attempt detected'
    },
    {
      pattern: /('|"|`|;|--|\/\*|\*\/)/,
      severity: 'HIGH',
      description: 'SQL special characters detected'
    },
    
    // XSS patterns
    {
      pattern: /<script|javascript:|data:|vbscript:|onload|onerror|onclick/i,
      severity: 'CRITICAL',
      description: 'XSS attempt detected'
    },
    {
      pattern: /(<|>|&lt;|&gt;|&#|%3C|%3E)/,
      severity: 'MEDIUM',
      description: 'HTML/XML characters detected'
    },
    
    // Command injection
    {
      pattern: /(\||&|;|`|\$\(|`)/,
      severity: 'HIGH',
      description: 'Command injection pattern detected'
    },
    
    // Path traversal
    {
      pattern: /\.\.\//,
      severity: 'HIGH',
      description: 'Path traversal attempt detected'
    },
    
    // LDAP injection
    {
      pattern: /(\(|\)|&|\||\=|\*|!|<|>|~)/,
      severity: 'MEDIUM',
      description: 'LDAP injection pattern detected'
    },
    
    // Excessive length (potential buffer overflow)
    {
      pattern: /.{1000,}/,
      severity: 'MEDIUM',
      description: 'Excessively long input detected'
    }
  ]

  // Common validation patterns
  private patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    creditCard: /^\d{13,19}$/,
    cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
    phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/
  }

  // Validate single value
  validateValue(value: any, rule: ValidationRule, fieldName: string): { isValid: boolean; error?: string; sanitized?: any } {
    // Check if required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return { isValid: false, error: `${fieldName} is required` }
    }

    // If not required and empty, return as valid
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return { isValid: true, sanitized: value }
    }

    let sanitized = value

    // Type validation
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            return { isValid: false, error: `${fieldName} must be a string` }
          }
          // Sanitize string
          sanitized = this.sanitizeString(value)
          break

        case 'number':
          const num = Number(value)
          if (isNaN(num)) {
            return { isValid: false, error: `${fieldName} must be a valid number` }
          }
          sanitized = num
          break

        case 'boolean':
          if (typeof value !== 'boolean') {
            return { isValid: false, error: `${fieldName} must be a boolean` }
          }
          break

        case 'email':
          if (!this.patterns.email.test(value)) {
            return { isValid: false, error: `${fieldName} must be a valid email address` }
          }
          sanitized = value.toLowerCase().trim()
          break

        case 'url':
          if (!this.patterns.url.test(value)) {
            return { isValid: false, error: `${fieldName} must be a valid URL` }
          }
          break

        case 'uuid':
          if (!this.patterns.uuid.test(value)) {
            return { isValid: false, error: `${fieldName} must be a valid UUID` }
          }
          break

        case 'json':
          try {
            sanitized = JSON.parse(value)
          } catch {
            return { isValid: false, error: `${fieldName} must be valid JSON` }
          }
          break
      }
    }

    // Length validation for strings
    if (typeof sanitized === 'string') {
      if (rule.minLength && sanitized.length < rule.minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${rule.minLength} characters` }
      }
      if (rule.maxLength && sanitized.length > rule.maxLength) {
        return { isValid: false, error: `${fieldName} must not exceed ${rule.maxLength} characters` }
      }
    }

    // Numeric range validation
    if (typeof sanitized === 'number') {
      if (rule.min !== undefined && sanitized < rule.min) {
        return { isValid: false, error: `${fieldName} must be at least ${rule.min}` }
      }
      if (rule.max !== undefined && sanitized > rule.max) {
        return { isValid: false, error: `${fieldName} must not exceed ${rule.max}` }
      }
    }

    // Pattern validation
    if (rule.pattern && typeof sanitized === 'string') {
      if (!rule.pattern.test(sanitized)) {
        return { isValid: false, error: `${fieldName} format is invalid` }
      }
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(sanitized)) {
      return { isValid: false, error: `${fieldName} must be one of: ${rule.allowedValues.join(', ')}` }
    }

    // Custom validator
    if (rule.customValidator && !rule.customValidator(sanitized)) {
      return { isValid: false, error: `${fieldName} failed custom validation` }
    }

    return { isValid: true, sanitized }
  }

  // Validate entire object against schema
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = []
    const sanitizedData: any = {}

    // Validate each field in schema
    for (const [fieldName, rule] of Object.entries(schema)) {
      const result = this.validateValue(data[fieldName], rule, fieldName)
      
      if (!result.isValid) {
        errors.push(result.error!)
      } else {
        sanitizedData[fieldName] = result.sanitized
      }
    }

    // Check for unexpected fields (potential attack)
    const allowedFields = Object.keys(schema)
    const providedFields = Object.keys(data || {})
    const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field))
    
    if (unexpectedFields.length > 0) {
      errors.push(`Unexpected fields detected: ${unexpectedFields.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    }
  }

  // Enhanced sanitization methods
  private sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous HTML characters
  }

  // Sanitize HTML content (removes all HTML tags)
  sanitizeHtmlContent(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
      .trim()
      .replace(/\s+/g, ' ')
  }

  // Sanitize user name (keeps only letters, spaces, and accents)
  sanitizeUserName(input: string): string {
    return input
      .trim()
      .replace(/[^a-zA-ZÀ-ÿ\s]/g, '') // Keep only letters and spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Sanitize phone number (keeps only numbers and common separators)
  sanitizePhoneNumber(input: string): string {
    return input
      .replace(/[^\d\+\-\(\)\s]/g, '') // Keep only numbers and phone separators
      .trim()
  }

  // Sanitize email (basic cleaning)
  sanitizeEmail(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^\w@.-]/g, '') // Keep only valid email characters
  }

  // Sanitize credit card number (removes spaces and keeps only digits)
  sanitizeCreditCard(input: string): string {
    return input
      .replace(/\D/g, '') // Keep only digits
  }

  // Sanitize Brazilian CPF/CNPJ
  sanitizeBrazilianDocument(input: string): string {
    return input
      .replace(/\D/g, '') // Keep only digits
  }

  // Deep sanitization for nested objects
  deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item))
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize keys too
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '')
        sanitized[sanitizedKey] = this.deepSanitize(value)
      }
      return sanitized
    }

    return obj
  }

  // Check for suspicious patterns
  async checkSuspiciousPatterns(
    data: any, 
    req?: NextRequest, 
    userId?: string
  ): Promise<void> {
    const dataStr = JSON.stringify(data).toLowerCase()
    
    for (const { pattern, severity, description } of this.suspiciousPatterns) {
      if (pattern.test(dataStr)) {
        // Log suspicious activity
        await securityLogger.logSuspiciousActivity(
          `${description}: ${pattern.source}`,
          userId,
          req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || undefined,
          severity,
          {
            pattern: pattern.source,
            matchedData: dataStr.match(pattern)?.[0],
            userAgent: req?.headers.get('user-agent'),
            endpoint: req?.nextUrl?.pathname
          }
        )
        
        // For critical patterns, we might want to block the request
        if (severity === 'CRITICAL') {
          throw new Error(`Security violation: ${description}`)
        }
      }
    }
  }

  // Validate common payment data
  validatePaymentData(data: any): ValidationResult {
    // For PIX payments, installments are not required
    const isPIXPayment = data.method === 'PIX'

    const schema: ValidationSchema = {
      packageId: {
        required: true,
        type: 'number',
        min: 1,
        max: 10
      },
      method: {
        required: false,
        type: 'string',
        allowedValues: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD']
      },
      token: {
        required: false,
        type: 'string',
        maxLength: 500
      },
      cardNumber: {
        required: false,
        type: 'string',
        pattern: /^\d{13,19}$/
      },
      expirationMonth: {
        required: false,
        type: 'number',
        min: 1,
        max: 12
      },
      expirationYear: {
        required: false,
        type: 'number',
        min: 2024,
        max: 2050
      },
      installments: {
        required: !isPIXPayment, // Not required for PIX payments
        type: 'number',
        min: 1,
        max: 12
      },
      identificationType: {
        required: false,
        type: 'string',
        allowedValues: ['CPF', 'CNPJ']
      },
      identificationNumber: {
        required: false,
        type: 'string',
        maxLength: 20
      },
      cardholderName: {
        required: false,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      securityCode: {
        required: false,
        type: 'string',
        minLength: 3,
        maxLength: 4,
        pattern: /^\d{3,4}$/
      }
    }

    return this.validate(data, schema)
  }

  // Enhanced credit card validation
  validateCreditCardData(data: any): ValidationResult {
    const schema: ValidationSchema = {
      packageId: {
        required: true,
        type: 'number',
        min: 1,
        max: 10
      },
      token: {
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 500,
        pattern: /^[a-zA-Z0-9_-]+$/
      },
      cardNumber: {
        required: false,
        type: 'string',
        customValidator: (value: string) => this.validateLuhn(value?.replace(/\s/g, ''))
      },
      expirationMonth: {
        required: false,
        type: 'number',
        min: 1,
        max: 12
      },
      expirationYear: {
        required: false,
        type: 'number',
        min: new Date().getFullYear(),
        max: new Date().getFullYear() + 10,
        customValidator: (year: number) => {
          // Check if expiration is not in the past
          const currentYear = new Date().getFullYear()
          const currentMonth = new Date().getMonth() + 1
          return year > currentYear || (year === currentYear)
        }
      },
      installments: {
        required: true,
        type: 'number',
        min: 1,
        max: 12
      },
      identificationType: {
        required: true,
        type: 'string',
        allowedValues: ['CPF', 'CNPJ']
      },
      identificationNumber: {
        required: true,
        type: 'string',
        minLength: 11,
        maxLength: 18,
        customValidator: (value: string) => {
          const cleaned = value.replace(/\D/g, '')
          return cleaned.length === 11 || cleaned.length === 14 // CPF or CNPJ
        }
      },
      cardholderName: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        customValidator: (value: string) => {
          // Should have at least first and last name
          const words = value.trim().split(/\s+/)
          return words.length >= 2 && words.every(word => word.length >= 2)
        }
      },
      securityCode: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 4,
        pattern: /^\d{3,4}$/
      }
    }

    const result = this.validate(data, schema)

    // Additional cross-field validation
    if (result.isValid && data.expirationMonth && data.expirationYear) {
      const currentDate = new Date()
      const expirationDate = new Date(data.expirationYear, data.expirationMonth - 1)

      if (expirationDate < currentDate) {
        result.isValid = false
        result.errors.push('Card expiration date is in the past')
      }
    }

    return result
  }

  // Luhn algorithm for credit card validation
  private validateLuhn(cardNumber: string): boolean {
    if (!cardNumber || !/^\d{13,19}$/.test(cardNumber)) {
      return false
    }

    let sum = 0
    let isEven = false

    // Loop through values starting from the rightmost digit
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i])

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      isEven = !isEven
    }

    return sum % 10 === 0
  }

  // Validate Brazilian CPF
  validateBrazilianCPF(cpf: string): ValidationResult {
    const schema: ValidationSchema = {
      cpf: {
        required: true,
        type: 'string',
        customValidator: (value: string) => {
          const cleaned = value.replace(/\D/g, '')

          // Check length
          if (cleaned.length !== 11) return false

          // Check for repeated digits
          if (/^(.)\1+$/.test(cleaned)) return false

          // Calculate verification digits
          let sum = 0
          for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned[i]) * (10 - i)
          }
          let digit1 = 11 - (sum % 11)
          if (digit1 > 9) digit1 = 0

          sum = 0
          for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned[i]) * (11 - i)
          }
          let digit2 = 11 - (sum % 11)
          if (digit2 > 9) digit2 = 0

          return parseInt(cleaned[9]) === digit1 && parseInt(cleaned[10]) === digit2
        }
      }
    }

    return this.validate({ cpf }, schema)
  }

  // Enhanced user data validation
  validateUserProfileData(data: any): ValidationResult {
    const schema: ValidationSchema = {
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        customValidator: (value: string) => {
          // Check for reasonable name format
          const words = value.trim().split(/\s+/)
          return words.length >= 1 && words.every(word => word.length >= 2)
        }
      },
      email: {
        required: true,
        type: 'email',
        maxLength: 255,
        customValidator: (value: string) => {
          // Additional email validation beyond basic regex
          const parts = value.split('@')
          if (parts.length !== 2) return false

          const [local, domain] = parts

          // Check local part
          if (local.length > 64 || local.startsWith('.') || local.endsWith('.')) return false
          if (local.includes('..')) return false

          // Check domain part
          if (domain.length > 253 || domain.startsWith('-') || domain.endsWith('-')) return false
          if (!domain.includes('.')) return false

          return true
        }
      },
      phone: {
        required: false,
        type: 'string',
        pattern: /^\+?[\d\s\-\(\)]+$/,
        minLength: 10,
        maxLength: 20
      },
      birthDate: {
        required: false,
        type: 'string',
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        customValidator: (value: string) => {
          const date = new Date(value)
          const now = new Date()
          const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())
          const maxAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate())

          return date >= minAge && date <= maxAge
        }
      }
    }

    return this.validate(data, schema)
  }

  // Validate user registration data
  validateUserRegistration(data: any): ValidationResult {
    const schema: ValidationSchema = {
      email: {
        required: true,
        type: 'email',
        maxLength: 255
      },
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      password: {
        required: true,
        type: 'string',
        minLength: 8,
        maxLength: 128,
        customValidator: (value: string) => {
          // Password must contain at least one letter and one number
          return /^(?=.*[a-zA-Z])(?=.*\d)/.test(value)
        }
      }
    }

    return this.validate(data, schema)
  }

  // Validate search/filter parameters
  validateSearchParams(data: any): ValidationResult {
    const schema: ValidationSchema = {
      query: {
        type: 'string',
        maxLength: 100
      },
      page: {
        type: 'number',
        min: 1,
        max: 1000
      },
      limit: {
        type: 'number',
        min: 1,
        max: 100
      },
      sortBy: {
        type: 'string',
        allowedValues: ['name', 'date', 'price', 'rarity']
      },
      order: {
        type: 'string',
        allowedValues: ['asc', 'desc']
      }
    }

    return this.validate(data, schema)
  }

  // Validate email verification data
  validateEmailVerification(data: any): ValidationResult {
    const schema: ValidationSchema = {
      token: {
        required: true,
        type: 'string',
        minLength: 32,
        maxLength: 128,
        pattern: /^[a-fA-F0-9]+$/
      }
    }

    return this.validate(data, schema)
  }
}

// Export singleton instance
export const inputValidator = new InputValidator()

// Convenience function for API route validation
export async function validateRequest(
  req: NextRequest,
  schema: ValidationSchema,
  userId?: string
): Promise<{ isValid: boolean; errors?: string[]; data?: any }> {
  try {
    const body = await req.json()
    
    // Check for suspicious patterns
    await inputValidator.checkSuspiciousPatterns(body, req, userId)
    
    // Validate against schema
    const result = inputValidator.validate(body, schema)
    
    if (!result.isValid) {
      // Log validation failure
      await securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: req.nextUrl?.pathname,
        method: req.method,
        description: `Input validation failed: ${result.errors.join(', ')}`,
        metadata: {
          validationErrors: result.errors,
          providedFields: Object.keys(body)
        }
      })
    }
    
    return {
      isValid: result.isValid,
      errors: result.errors,
      data: result.sanitizedData
    }
    
  } catch (error) {
    // Log parsing/security error
    await securityLogger.log({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      userId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      endpoint: req.nextUrl?.pathname,
      method: req.method,
      description: `Request validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    })
    
    return {
      isValid: false,
      errors: ['Invalid request format or security violation']
    }
  }
}