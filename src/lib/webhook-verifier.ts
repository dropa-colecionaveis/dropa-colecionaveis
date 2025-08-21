import crypto from 'crypto'
import { securityLogger } from '@/lib/security-logger'

export interface WebhookVerificationResult {
  isValid: boolean
  error?: string
  paymentId?: string
  status?: string
  metadata?: any
}

export interface MercadoPagoWebhookData {
  id: string
  live_mode: boolean
  type: string
  date_created: string
  application_id: string
  user_id: string
  version: number
  api_version: string
  action: string
  data: {
    id: string
  }
}

class WebhookVerifier {
  private readonly secret: string

  constructor() {
    this.secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || ''
    
    if (!this.secret) {
      console.warn('⚠️ MERCADO_PAGO_WEBHOOK_SECRET not configured - webhook verification disabled')
    }
  }

  // Verify Mercado Pago webhook signature
  verifyMercadoPagoWebhook(
    payload: string,
    signature: string | null,
    timestamp: string | null
  ): boolean {
    try {
      if (!this.secret) {
        console.warn('⚠️ Webhook secret not configured, skipping verification')
        return true // Allow in development, but log warning
      }

      if (!signature || !timestamp) {
        console.error('❌ Missing webhook signature or timestamp')
        return false
      }

      // Mercado Pago webhook signature format: ts=timestamp,v1=signature
      const sigParts = signature.split(',')
      let ts = ''
      let v1 = ''

      for (const part of sigParts) {
        const [key, value] = part.split('=')
        if (key === 'ts') ts = value
        if (key === 'v1') v1 = value
      }

      if (!ts || !v1) {
        console.error('❌ Invalid webhook signature format')
        return false
      }

      // Check timestamp (prevent replay attacks - max 5 minutes old)
      const webhookTime = parseInt(ts) * 1000
      const currentTime = Date.now()
      const timeDiff = Math.abs(currentTime - webhookTime)
      
      if (timeDiff > 5 * 60 * 1000) { // 5 minutes
        console.error('❌ Webhook timestamp too old:', timeDiff / 1000, 'seconds')
        return false
      }

      // Verify signature
      const signedPayload = `${ts}.${payload}`
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(signedPayload)
        .digest('hex')

      const providedSignature = v1

      // Use constant time comparison to prevent timing attacks
      if (!this.constantTimeCompare(expectedSignature, providedSignature)) {
        console.error('❌ Webhook signature verification failed')
        return false
      }

      console.log('✅ Webhook signature verified successfully')
      return true

    } catch (error) {
      console.error('❌ Webhook verification error:', error)
      return false
    }
  }

  // Constant time string comparison to prevent timing attacks
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  // Process and validate webhook data
  async processWebhookData(
    rawData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<WebhookVerificationResult> {
    try {
      // Validate webhook data structure
      if (!this.isValidWebhookData(rawData)) {
        await securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          ipAddress,
          userAgent,
          description: 'Invalid webhook data structure received',
          metadata: {
            receivedData: rawData,
            expectedFields: ['id', 'type', 'action', 'data']
          }
        })

        return {
          isValid: false,
          error: 'Invalid webhook data structure'
        }
      }

      const webhookData = rawData as MercadoPagoWebhookData

      // Validate webhook type and action
      if (!this.isValidWebhookType(webhookData.type, webhookData.action)) {
        await securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          ipAddress,
          userAgent,
          description: `Unexpected webhook type/action: ${webhookData.type}/${webhookData.action}`,
          metadata: {
            type: webhookData.type,
            action: webhookData.action,
            webhookId: webhookData.id
          }
        })

        return {
          isValid: false,
          error: `Unsupported webhook type: ${webhookData.type}/${webhookData.action}`
        }
      }

      // Extract payment information
      const paymentId = webhookData.data?.id
      if (!paymentId) {
        return {
          isValid: false,
          error: 'Missing payment ID in webhook data'
        }
      }

      // Log successful webhook processing
      await securityLogger.log({
        type: 'PAYMENT_ATTEMPT',
        severity: 'LOW',
        ipAddress,
        userAgent,
        description: `Webhook received: ${webhookData.type}/${webhookData.action}`,
        metadata: {
          webhookId: webhookData.id,
          paymentId: paymentId,
          liveMode: webhookData.live_mode,
          type: webhookData.type,
          action: webhookData.action
        }
      })

      return {
        isValid: true,
        paymentId: paymentId,
        status: webhookData.action,
        metadata: {
          webhookId: webhookData.id,
          liveMode: webhookData.live_mode,
          type: webhookData.type,
          dateCreated: webhookData.date_created
        }
      }

    } catch (error) {
      await securityLogger.log({
        type: 'API_ERROR',
        severity: 'HIGH',
        ipAddress,
        userAgent,
        description: `Webhook processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          rawData: rawData
        }
      })

      return {
        isValid: false,
        error: 'Internal webhook processing error'
      }
    }
  }

  // Validate webhook data structure
  private isValidWebhookData(data: any): data is MercadoPagoWebhookData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.type === 'string' &&
      typeof data.action === 'string' &&
      data.data &&
      typeof data.data === 'object' &&
      typeof data.data.id === 'string'
    )
  }

  // Validate webhook type and action
  private isValidWebhookType(type: string, action: string): boolean {
    const validCombinations = [
      // Payment webhooks
      { type: 'payment', action: 'payment.created' },
      { type: 'payment', action: 'payment.updated' },
      
      // Merchant order webhooks
      { type: 'merchant_order', action: 'merchant_order.created' },
      { type: 'merchant_order', action: 'merchant_order.updated' },
      
      // Plan webhooks (for subscriptions)
      { type: 'plan', action: 'plan.created' },
      { type: 'plan', action: 'plan.updated' },
      
      // Subscription webhooks
      { type: 'subscription', action: 'subscription.created' },
      { type: 'subscription', action: 'subscription.updated' },
      
      // Invoice webhooks
      { type: 'invoice', action: 'invoice.created' },
      { type: 'invoice', action: 'invoice.updated' },
      
      // Point integration webhooks
      { type: 'point_integration_wh', action: 'point_integration.created' },
      { type: 'point_integration_wh', action: 'point_integration.updated' }
    ]

    return validCombinations.some(
      combo => combo.type === type && combo.action === action
    )
  }

  // Validate IP address against Mercado Pago whitelist
  validateWebhookIP(ipAddress: string): boolean {
    // Mercado Pago webhook IP ranges (update these based on MP documentation)
    const allowedIPRanges = [
      '209.225.49.0/24',
      '216.33.197.0/24',
      '216.33.196.0/24',
      '209.225.48.0/24'
    ]

    // For development, allow localhost
    if (process.env.NODE_ENV === 'development') {
      if (['127.0.0.1', '::1', 'localhost'].includes(ipAddress)) {
        return true
      }
    }

    // Check if IP is in allowed ranges
    return this.isIPInRanges(ipAddress, allowedIPRanges)
  }

  // Check if IP is in CIDR ranges
  private isIPInRanges(ip: string, ranges: string[]): boolean {
    // Simple IP range checking (for production, use a proper IP library)
    for (const range of ranges) {
      if (this.isIPInRange(ip, range)) {
        return true
      }
    }
    return false
  }

  // Simple CIDR check (basic implementation)
  private isIPInRange(ip: string, cidr: string): boolean {
    // For production, use a proper CIDR library like 'ip-range-check'
    // This is a simplified version
    const [rangeIP, prefixLength] = cidr.split('/')
    const prefix = parseInt(prefixLength)
    
    // Convert IPs to numbers for comparison
    const ipNum = this.ipToNumber(ip)
    const rangeNum = this.ipToNumber(rangeIP)
    
    if (ipNum === null || rangeNum === null) return false
    
    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0
    
    return (ipNum & mask) === (rangeNum & mask)
  }

  // Convert IP to number
  private ipToNumber(ip: string): number | null {
    const parts = ip.split('.')
    if (parts.length !== 4) return null
    
    let result = 0
    for (const part of parts) {
      const num = parseInt(part)
      if (isNaN(num) || num < 0 || num > 255) return null
      result = (result << 8) + num
    }
    return result
  }

  // Generate webhook URL for configuration
  generateWebhookURL(baseURL?: string): string {
    const base = baseURL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return `${base}/api/webhooks/mercadopago`
  }

  // Get webhook configuration instructions
  getWebhookSetupInstructions(): string {
    const webhookURL = this.generateWebhookURL()
    
    return `
📡 WEBHOOK CONFIGURATION INSTRUCTIONS

1. Access your Mercado Pago Developer Dashboard
2. Go to "Webhooks" section
3. Create a new webhook with these settings:

   🔗 URL: ${webhookURL}
   📋 Events: payment.created, payment.updated
   🔐 Secret: Set MERCADO_PAGO_WEBHOOK_SECRET environment variable

4. Test the webhook using Mercado Pago's test tools

⚠️ IMPORTANT SECURITY NOTES:
- Always use HTTPS in production
- Keep webhook secret secure and rotate periodically
- Monitor webhook logs for suspicious activity
- Implement proper IP whitelisting
    `
  }
}

// Export singleton instance
export const webhookVerifier = new WebhookVerifier()