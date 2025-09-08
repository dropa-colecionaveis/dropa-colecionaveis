import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Direct Mercado Pago integration to avoid import issues
const { MercadoPagoConfig, Payment } = require('mercadopago')

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  }
})

const payment = new Payment(client)

// Credit packages now loaded dynamically from database

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    console.log('🔥 PIX API called')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', session.user.id)

    const body = await req.json()
    console.log('📦 Request body:', body)
    
    if (!body.packageId) {
      console.log('❌ Missing package ID')
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Get credit package details from database
    console.log('🎁 Looking for package ID:', body.packageId)
    
    let creditPackage = null
    
    // Se for um ID numérico, buscar por ordem (compatibilidade)
    if (typeof body.packageId === 'number') {
      const packages = await prisma.creditPackage.findMany({
        where: { isActive: true },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      })
      creditPackage = packages[body.packageId - 1] // Index baseado em 1
    } else {
      // Se for string, buscar por ID direto
      creditPackage = await prisma.creditPackage.findUnique({
        where: { 
          id: body.packageId,
          isActive: true 
        }
      })
    }
    
    if (!creditPackage) {
      console.log('❌ Invalid package ID:', body.packageId)
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      )
    }
    console.log('✅ Credit package found:', creditPackage)

    // Get user details
    console.log('👤 Looking for user:', session.user.id)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      console.log('❌ User not found:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    console.log('✅ User found:', user.email)

    // Generate unique external reference
    const externalReference = `credit_${creditPackage.id}_${Date.now()}_${user.id.slice(-8)}`
    console.log('🔗 External reference:', externalReference)

    // Create PIX payment directly with Mercado Pago
    console.log('💰 Creating PIX payment...')
    
    const paymentData = {
      transaction_amount: creditPackage.price,
      description: `${creditPackage.credits} créditos - Colecionáveis Platform`,
      payment_method_id: 'pix',
      external_reference: externalReference,
      // notification_url removido para desenvolvimento local
      // notification_url: `${process.env.NEXTAUTH_URL}/api/payments/mercadopago/webhook`,
      payer: {
        email: user.email,
      },
    }

    console.log('📤 Sending to Mercado Pago:', JSON.stringify(paymentData, null, 2))
    const response = await payment.create({ body: paymentData })
    
    if (!response) {
      console.error('❌ No response from Mercado Pago')
      throw new Error('No response from Mercado Pago')
    }

    console.log('✅ PIX payment created:', {
      id: response.id,
      status: response.status,
      hasQrCode: !!response.point_of_interaction?.transaction_data?.qr_code,
      hasQrCodeBase64: !!response.point_of_interaction?.transaction_data?.qr_code_base64,
    })

    const pixPayment = {
      id: response.id!.toString(),
      status: response.status!,
      qrCode: response.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      copyPasteCode: response.point_of_interaction?.transaction_data?.qr_code || '',
      expirationDate: response.date_of_expiration || '',
    }

    // Save payment record in database
    console.log('💾 Saving payment to database...')
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: user.id,
        externalId: pixPayment.id,
        status: 'PENDING',
        method: 'PIX',
        amount: creditPackage.price,
        credits: creditPackage.credits,
        packageId: body.packageId, // Manter compatibilidade
        creditPackageId: creditPackage.id, // Novo campo para referência
        pixQrCode: pixPayment.qrCode,
        pixQrCodeBase64: pixPayment.qrCodeBase64,
        pixCopyPaste: pixPayment.copyPasteCode,
        expiresAt: pixPayment.expirationDate ? new Date(pixPayment.expirationDate) : new Date(Date.now() + 15 * 60 * 1000), // 15 minutes default
        mercadoPagoData: {
          originalResponse: {
            id: pixPayment.id,
            status: pixPayment.status,
          }
        }
      }
    })

    const apiResponse = {
      success: true,
      paymentId: paymentRecord.id,
      status: 'PENDING',
      pixQrCode: pixPayment.qrCode,
      pixQrCodeBase64: pixPayment.qrCodeBase64,
      pixCopyPaste: pixPayment.copyPasteCode,
      expirationDate: pixPayment.expirationDate,
      amount: creditPackage.price,
      credits: creditPackage.credits,
      message: 'PIX payment created successfully'
    }

    console.log(`✅ PIX payment created for user ${user.id}: ${paymentRecord.id}`)

    return NextResponse.json(apiResponse)

  } catch (error) {
    console.error('💥 PIX payment creation error:', error)
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}