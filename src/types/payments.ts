export type PaymentMethod = 'PIX'

export type PaymentStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'REFUNDED'

export interface CreditPackage {
  id: number
  credits: number
  price: number
  popular: boolean
}

export interface PaymentRequest {
  packageId: number
  method: PaymentMethod
}

export interface PaymentResponse {
  success: boolean
  paymentId: string
  status: PaymentStatus
  // PIX specific fields
  pixQrCode?: string
  pixQrCodeBase64?: string
  pixCopyPaste?: string
  expirationDate?: string
  // Common fields
  amount: number
  credits: number
  message?: string
  error?: string
}

export interface WebhookNotification {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type: string
  user_id: string
}

export interface PaymentStatusUpdate {
  paymentId: string
  status: PaymentStatus
  statusDetail?: string
  approvedAt?: Date
  failedAt?: Date
  failureReason?: string
}