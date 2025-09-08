import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { clearCreditPackagesCache } from '@/lib/mercadopago'

// GET - Busca um pacote específico
export async function GET(
  request: Request,
  { params }: { params: { packageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: params.packageId },
      include: {
        _count: {
          select: { payments: true }
        }
      }
    })

    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Credit package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ package: creditPackage })
  } catch (error) {
    console.error('Error fetching credit package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Atualiza um pacote específico
export async function PUT(
  request: Request,
  { params }: { params: { packageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { credits, price, isPopular, displayOrder, isActive } = body

    // Buscar pacote atual
    const currentPackage = await prisma.creditPackage.findUnique({
      where: { id: params.packageId }
    })

    if (!currentPackage) {
      return NextResponse.json(
        { error: 'Credit package not found' },
        { status: 404 }
      )
    }

    // Validações
    if (credits !== undefined && (credits <= 0 || !Number.isInteger(credits))) {
      return NextResponse.json(
        { error: 'Credits must be a positive integer' },
        { status: 400 }
      )
    }

    if (price !== undefined && price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    // Verificar duplicatas (excluindo o pacote atual)
    if (credits !== undefined || price !== undefined) {
      const existing = await prisma.creditPackage.findFirst({
        where: {
          id: { not: params.packageId },
          credits: credits !== undefined ? parseInt(credits) : currentPackage.credits,
          price: price !== undefined ? parseFloat(price) : currentPackage.price
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A package with the same credits and price already exists' },
          { status: 409 }
        )
      }
    }

    const updatedPackage = await prisma.creditPackage.update({
      where: { id: params.packageId },
      data: {
        ...(credits !== undefined && { credits: parseInt(credits) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isPopular !== undefined && { isPopular: Boolean(isPopular) }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    })

    // Log da ação administrativa
    await prisma.adminLog.create({
      data: {
        userId: session.user.id!,
        action: 'UPDATE_CREDIT_PACKAGE',
        description: `Updated credit package: ${updatedPackage.credits} credits for R$ ${updatedPackage.price}`,
        metadata: {
          packageId: updatedPackage.id,
          changes: body,
          previousValues: {
            credits: currentPackage.credits,
            price: currentPackage.price,
            isPopular: currentPackage.isPopular,
            displayOrder: currentPackage.displayOrder,
            isActive: currentPackage.isActive
          }
        }
      }
    })

    // Limpar cache para refletir mudanças imediatamente
    clearCreditPackagesCache()

    return NextResponse.json({ 
      message: 'Credit package updated successfully',
      package: updatedPackage 
    })
  } catch (error) {
    console.error('Error updating credit package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove/desativa um pacote específico
export async function DELETE(
  request: Request,
  { params }: { params: { packageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: params.packageId },
      include: {
        _count: {
          select: { payments: true }
        }
      }
    })

    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Credit package not found' },
        { status: 404 }
      )
    }

    // Se tem pagamentos associados, apenas desativar
    if (creditPackage._count.payments > 0) {
      const updatedPackage = await prisma.creditPackage.update({
        where: { id: params.packageId },
        data: { isActive: false }
      })

      await prisma.adminLog.create({
        data: {
          userId: session.user.id!,
          action: 'DEACTIVATE_CREDIT_PACKAGE',
          description: `Deactivated credit package with payments: ${creditPackage.credits} credits for R$ ${creditPackage.price}`,
          metadata: {
            packageId: params.packageId,
            paymentsCount: creditPackage._count.payments
          }
        }
      })

      // Limpar cache para refletir mudanças imediatamente
      clearCreditPackagesCache()

      return NextResponse.json({ 
        message: 'Credit package deactivated (has associated payments)',
        package: updatedPackage 
      })
    } else {
      // Se não tem pagamentos, pode deletar completamente
      await prisma.creditPackage.delete({
        where: { id: params.packageId }
      })

      await prisma.adminLog.create({
        data: {
          userId: session.user.id!,
          action: 'DELETE_CREDIT_PACKAGE',
          description: `Deleted credit package: ${creditPackage.credits} credits for R$ ${creditPackage.price}`,
          metadata: {
            packageId: params.packageId,
            credits: creditPackage.credits,
            price: creditPackage.price
          }
        }
      })

      // Limpar cache para refletir mudanças imediatamente
      clearCreditPackagesCache()

      return NextResponse.json({ 
        message: 'Credit package deleted successfully' 
      })
    }
  } catch (error) {
    console.error('Error deleting credit package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}