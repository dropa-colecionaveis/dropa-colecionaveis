import { MercadoPagoConfig, Payment, PreApprovalPlan } from 'mercadopago'

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  }
})

// Create payment instance
export const payment = new Payment(client)

// Payment interfaces
export interface PIXPaymentRequest {
  amount: number
  credits: number
  packageId: number
  userId: string
  description: string
  externalReference: string
}

export interface CardPaymentRequest {
  amount: number
  credits: number
  packageId: number
  userId: string
  description: string
  externalReference: string
  token: string
  installments: number
  email: string
  identificationType?: string
  identificationNumber?: string
}

export interface PIXPaymentResponse {
  id: string
  status: string
  qrCode: string
  qrCodeBase64: string
  copyPasteCode: string
  expirationDate: string
}

export interface CardPaymentResponse {
  id: string
  status: string
  statusDetail: string
  transactionAmount: number
  installments: number
  paymentMethodId: string
}

// Create PIX payment
export async function createPIXPayment(data: PIXPaymentRequest): Promise<PIXPaymentResponse> {
  try {
    console.log('Creating PIX payment:', {
      amount: data.amount,
      credits: data.credits,
      packageId: data.packageId,
      description: data.description,
    })
    
    const paymentData = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: 'pix',
      external_reference: data.externalReference,
      notification_url: `${process.env.NEXTAUTH_URL}/api/payments/mercadopago/webhook`,
      payer: {
        email: `user-${data.userId}@colecionaveis.com`, // Temporary email format
      },
    }

    console.log('Sending payment data to Mercado Pago:', JSON.stringify(paymentData, null, 2))

    const response = await payment.create({ body: paymentData })
    
    if (!response) {
      console.error('No response from Mercado Pago')
      throw new Error('No response from Mercado Pago')
    }

    console.log('PIX payment created successfully:', {
      id: response.id,
      status: response.status,
      hasQrCode: !!response.point_of_interaction?.transaction_data?.qr_code,
      hasQrCodeBase64: !!response.point_of_interaction?.transaction_data?.qr_code_base64,
    })

    return {
      id: response.id!.toString(),
      status: response.status!,
      qrCode: response.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      copyPasteCode: response.point_of_interaction?.transaction_data?.qr_code || '',
      expirationDate: response.date_of_expiration || '',
    }
  } catch (error) {
    console.error('Error creating PIX payment:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? error.cause : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw new Error(`Failed to create PIX payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Create Credit Card payment
export async function createCardPayment(data: CardPaymentRequest): Promise<CardPaymentResponse> {
  try {
    console.log('Creating card payment:', {
      ...data,
      token: '[HIDDEN]'
    })
    
    const paymentData = {
      transaction_amount: data.amount,
      token: data.token,
      description: data.description,
      installments: data.installments,
      payment_method_id: 'visa', // This should come from token data
      external_reference: data.externalReference,
      notification_url: `${process.env.NEXTAUTH_URL}/api/payments/mercadopago/webhook`,
      payer: {
        email: data.email,
        identification: data.identificationType && data.identificationNumber ? {
          type: data.identificationType,
          number: data.identificationNumber,
        } : undefined,
      },
    }

    const response = await payment.create({ body: paymentData })
    
    if (!response) {
      throw new Error('No response from Mercado Pago')
    }

    console.log('Card payment created:', response.id)

    return {
      id: response.id!.toString(),
      status: response.status!,
      statusDetail: response.status_detail || '',
      transactionAmount: response.transaction_amount!,
      installments: response.installments!,
      paymentMethodId: response.payment_method_id!,
    }
  } catch (error) {
    console.error('Error creating card payment:', error)
    throw new Error('Failed to create card payment')
  }
}

// Get payment status
export async function getPaymentStatus(paymentId: string) {
  try {
    const response = await payment.get({ id: paymentId })
    return {
      id: response.id!.toString(),
      status: response.status!,
      statusDetail: response.status_detail || '',
      transactionAmount: response.transaction_amount!,
      externalReference: response.external_reference || '',
    }
  } catch (error) {
    console.error('Error getting payment status:', error)
    throw new Error('Failed to get payment status')
  }
}

// Mercado Pago webhook signature validation
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const expectedSignature = hmac.digest('hex')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

// Payment status mapping
export function mapMercadoPagoStatus(status: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED' {
  switch (status) {
    case 'approved':
      return 'APPROVED'
    case 'rejected':
      return 'REJECTED'
    case 'cancelled':
      return 'CANCELLED'
    case 'expired':
      return 'EXPIRED'
    case 'refunded':
      return 'REFUNDED'
    case 'pending':
    case 'in_process':
    case 'authorized':
    default:
      return 'PENDING'
  }
}

// Credit package configurations
export const CREDIT_PACKAGES = [
  { id: 1, credits: 100, price: 10, popular: false },
  { id: 2, credits: 250, price: 20, popular: true },
  { id: 3, credits: 500, price: 35, popular: false },
  { id: 4, credits: 1000, price: 60, popular: false },
  { id: 5, credits: 2500, price: 120, popular: false },
] as const

export function getCreditPackage(packageId: number) {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
}

export default client