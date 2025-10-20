import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
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

    // Get user's payment history
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Limit to last 50 payments
      select: {
        id: true,
        externalId: true,
        status: true,
        method: true,
        amount: true,
        credits: true,
        createdAt: true,
        approvedAt: true,
        failedAt: true,
        failureReason: true,
        packageId: true,
        creditPackageId: true
      }
    })

    // Format payments for frontend
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      externalId: payment.externalId,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      credits: payment.credits,
      createdAt: payment.createdAt,
      approvedAt: payment.approvedAt,
      failedAt: payment.failedAt,
      failureReason: payment.failureReason,
      packageId: payment.packageId,
      creditPackageId: payment.creditPackageId,
      statusText: getStatusText(payment.status),
      statusColor: getStatusColor(payment.status)
    }))

    return NextResponse.json({
      success: true,
      payments: formattedPayments
    })

  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Processando'
    case 'APPROVED':
      return 'Aprovado'
    case 'REJECTED':
      return 'Recusado'
    case 'CANCELLED':
      return 'Cancelado'
    case 'EXPIRED':
      return 'Expirado'
    case 'REFUNDED':
      return 'Reembolsado'
    default:
      return status
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'yellow'
    case 'APPROVED':
      return 'green'
    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
      return 'red'
    case 'REFUNDED':
      return 'blue'
    default:
      return 'gray'
  }
}