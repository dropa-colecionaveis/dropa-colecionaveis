import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        userId: session.user.id // Ensure user can only check their own payments
      },
      select: {
        id: true,
        status: true,
        method: true,
        amount: true,
        credits: true,
        pixQrCode: true,
        pixQrCodeBase64: true,
        pixCopyPaste: true,
        expiresAt: true,
        approvedAt: true,
        failedAt: true,
        failureReason: true,
        createdAt: true,
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if PIX payment has expired
    if (payment.method === 'PIX' && payment.status === 'PENDING' && payment.expiresAt && new Date() > payment.expiresAt) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'EXPIRED',
          failedAt: new Date(),
          failureReason: 'Payment expired'
        }
      })
      
      return NextResponse.json({
        ...payment,
        status: 'EXPIRED',
        failedAt: new Date(),
        failureReason: 'Payment expired'
      })
    }

    return NextResponse.json(payment)

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}