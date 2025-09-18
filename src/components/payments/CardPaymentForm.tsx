'use client'

import { useState, useEffect } from 'react'

interface CardPaymentFormProps {
  amount: number
  credits: number
  packageId: number
  onPayment: (cardData: CardFormData) => void
  onCancel: () => void
  loading: boolean
}

interface CardFormData {
  token: string
  installments: number
  identificationType?: string
  identificationNumber?: string
  cardNumber?: string
  expirationMonth?: number
  expirationYear?: number
  cardholderName?: string
  securityCode?: string
}

declare global {
  interface Window {
    MercadoPago: any
  }
}

export default function CardPaymentForm({ 
  amount, 
  credits, 
  packageId, 
  onPayment, 
  onCancel, 
  loading 
}: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [installments, setInstallments] = useState(1)
  const [availableInstallments, setAvailableInstallments] = useState<any[]>([])
  const [identificationType, setIdentificationType] = useState('CPF')
  const [identificationNumber, setIdentificationNumber] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mpLoaded, setMpLoaded] = useState(false)

  // Load Mercado Pago SDK
  useEffect(() => {
    const loadMercadoPagoSDK = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]')
      
      if (window.MercadoPago || existingScript) {
        setMpLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.onload = () => {
        setMpLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load Mercado Pago SDK')
      }
      document.head.appendChild(script)
    }

    loadMercadoPagoSDK()
  }, [])

  // Load installments when card number changes
  useEffect(() => {
    if (mpLoaded && cardNumber.replace(/\s/g, '').length >= 6) {
      loadInstallments()
    }
  }, [cardNumber, amount, mpLoaded])

  const loadInstallments = async () => {
    try {
      // Limit to maximum 3x installments to avoid additional fees
      const defaultInstallments = [
        { installments: 1, installment_amount: amount, installment_rate: 0 },
        { installments: 2, installment_amount: amount / 2, installment_rate: 0 },
        { installments: 3, installment_amount: amount / 3, installment_rate: 0 }
      ]
      
      setAvailableInstallments(defaultInstallments)
      setInstallments(1)
    } catch (error) {
      console.error('Error loading installments:', error)
    }
  }

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')
    const formatted = digits.replace(/(\d{4})/g, '$1 ').trim()
    return formatted.substring(0, 19)
  }

  const formatExpiryMonth = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length >= 2) {
      const month = parseInt(digits.substring(0, 2))
      if (month > 12) return '12'
      if (month < 1) return '01'
      return digits.substring(0, 2).padStart(2, '0')
    }
    return digits
  }

  const formatExpiryYear = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.substring(0, 2)
  }

  const formatSecurityCode = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.substring(0, 4)
  }

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Número do cartão inválido'
    }

    if (!expiryMonth || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
      newErrors.expiryMonth = 'Mês inválido'
    }

    if (!expiryYear || parseInt(expiryYear) < new Date().getFullYear() % 100) {
      newErrors.expiryYear = 'Ano inválido'
    }

    if (!securityCode || securityCode.length < 3) {
      newErrors.securityCode = 'Código de segurança inválido'
    }

    if (!cardholderName || cardholderName.trim().length < 3) {
      newErrors.cardholderName = 'Nome no cartão é obrigatório'
    }

    if (!identificationNumber || identificationNumber.replace(/\D/g, '').length < 11) {
      newErrors.identificationNumber = 'CPF inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !window.MercadoPago) {
      console.log('Validation failed or MP not loaded')
      return
    }

    try {
      // Create MercadoPago instance with explicit configuration
      const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-5e121b09-e8c6-4932-8084-a7b412fe5519'
      console.log('🔧 Initializing Mercado Pago with key:', publicKey)
      
      const mp = new window.MercadoPago(publicKey, {
        locale: 'pt-BR'
      })

      console.log('🔧 Creating card token with data:', {
        cardNumber: cardNumber.replace(/\s/g, '').substring(0, 6) + '****',
        expirationMonth: parseInt(expiryMonth),
        expirationYear: parseInt(`20${expiryYear}`),
        cardholderName: cardholderName
      })

      // Try alternative token creation method
      let cardToken
      try {
        // Method 1: Original approach
        cardToken = await mp.createCardToken({
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardholder: {
            name: cardholderName,
            identification: {
              type: identificationType,
              number: identificationNumber.replace(/\D/g, '')
            }
          },
          securityCode: securityCode,
          expirationMonth: parseInt(expiryMonth),
          expirationYear: parseInt(`20${expiryYear}`)
        })
        console.log('✅ Token created with original method')
      } catch (tokenError) {
        console.log('❌ Original token method failed:', tokenError)
        
        // Method 2: Alternative format
        try {
          cardToken = await mp.createCardToken({
            card_number: cardNumber.replace(/\s/g, ''),
            cardholder: {
              name: cardholderName,
              identification: {
                type: identificationType,
                number: identificationNumber.replace(/\D/g, '')
              }
            },
            security_code: securityCode,
            expiration_month: parseInt(expiryMonth),
            expiration_year: parseInt(`20${expiryYear}`)
          })
          console.log('✅ Token created with alternative method')
        } catch (tokenError2) {
          console.log('❌ Alternative token method failed:', tokenError2)
          throw new Error('Both token creation methods failed')
        }
      }

      console.log('✅ Token created successfully:', {
        id: cardToken.id,
        hasId: !!cardToken.id,
        tokenLength: cardToken.id?.length,
        tokenObject: cardToken
      })

      // Validate token creation
      if (!cardToken.id || cardToken.id.length < 10) {
        throw new Error('Invalid token generated')
      }

      const cardData: CardFormData = {
        token: cardToken.id,
        installments: installments,
        identificationType: identificationType,
        identificationNumber: identificationNumber.replace(/\D/g, ''),
        cardNumber: cardNumber.replace(/\s/g, ''), // Full card number for direct approach
        expirationMonth: parseInt(expiryMonth),
        expirationYear: parseInt(`20${expiryYear}`),
        cardholderName: cardholderName,
        securityCode: securityCode
      }

      onPayment(cardData)
    } catch (error) {
      console.error('Error creating card token:', error)
      setErrors({ general: 'Erro ao processar cartão. Verifique os dados e tente novamente.' })
    }
  }

  if (!mpLoaded) {
    return (
      <div className="text-center py-8">
        <div className="text-white">Carregando formulário de pagamento...</div>
        <div className="mt-2 text-gray-400 text-sm">Inicializando Mercado Pago</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errors.general && (
        <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Número do Cartão
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.cardNumber ? 'border-red-400' : 'border-gray-600'
          }`}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />
        {errors.cardNumber && <span className="text-red-400 text-xs mt-1">{errors.cardNumber}</span>}
      </div>

      {/* Expiry and Security Code */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Mês
          </label>
          <input
            type="text"
            value={expiryMonth}
            onChange={(e) => setExpiryMonth(formatExpiryMonth(e.target.value))}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.expiryMonth ? 'border-red-400' : 'border-gray-600'
            }`}
            placeholder="12"
            maxLength={2}
          />
          {errors.expiryMonth && <span className="text-red-400 text-xs mt-1">{errors.expiryMonth}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Ano
          </label>
          <input
            type="text"
            value={expiryYear}
            onChange={(e) => setExpiryYear(formatExpiryYear(e.target.value))}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.expiryYear ? 'border-red-400' : 'border-gray-600'
            }`}
            placeholder="29"
            maxLength={2}
          />
          {errors.expiryYear && <span className="text-red-400 text-xs mt-1">{errors.expiryYear}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            CVV
          </label>
          <input
            type="text"
            value={securityCode}
            onChange={(e) => setSecurityCode(formatSecurityCode(e.target.value))}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.securityCode ? 'border-red-400' : 'border-gray-600'
            }`}
            placeholder="321"
            maxLength={4}
          />
          {errors.securityCode && <span className="text-red-400 text-xs mt-1">{errors.securityCode}</span>}
        </div>
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Nome no Cartão
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.cardholderName ? 'border-red-400' : 'border-gray-600'
          }`}
          placeholder="JOÃO DA SILVA"
        />
        {errors.cardholderName && <span className="text-red-400 text-xs mt-1">{errors.cardholderName}</span>}
      </div>

      {/* CPF */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          CPF
        </label>
        <input
          type="text"
          value={identificationNumber}
          onChange={(e) => setIdentificationNumber(formatCPF(e.target.value))}
          className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.identificationNumber ? 'border-red-400' : 'border-gray-600'
          }`}
          placeholder="000.000.000-00"
          maxLength={14}
        />
        {errors.identificationNumber && <span className="text-red-400 text-xs mt-1">{errors.identificationNumber}</span>}
      </div>

      {/* Installments */}
      {availableInstallments.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Parcelas
          </label>
          <select
            value={installments}
            onChange={(e) => setInstallments(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableInstallments.map((installment) => (
              <option key={installment.installments} value={installment.installments}>
                {installment.installments}x de R$ {installment.installment_amount.toFixed(2)}
                {installment.installment_rate === 0 ? ' sem juros' : ` (${installment.installment_rate}% juros)`}
              </option>
            ))}
          </select>
        </div>
      )}


      {/* Buttons */}
      <div className="flex space-x-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}