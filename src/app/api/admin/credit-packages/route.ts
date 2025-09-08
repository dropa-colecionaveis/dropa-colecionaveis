import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { clearCreditPackagesCache } from '@/lib/mercadopago'

// GET - Lista todos os pacotes de créditos
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const packages = await prisma.creditPackage.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Error fetching credit packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Cria um novo pacote de créditos
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { credits, price, isPopular, displayOrder, isActive = true } = body

    // Validações
    if (!credits || credits <= 0) {
      return NextResponse.json(
        { error: 'Credits must be a positive number' },
        { status: 400 }
      )
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    // Verificar se já existe um pacote com os mesmos créditos e preço
    const existing = await prisma.creditPackage.findFirst({
      where: {
        credits: parseInt(credits),
        price: parseFloat(price)
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A package with the same credits and price already exists' },
        { status: 409 }
      )
    }

    const newPackage = await prisma.creditPackage.create({
      data: {
        credits: parseInt(credits),
        price: parseFloat(price),
        isPopular: Boolean(isPopular),
        displayOrder: parseInt(displayOrder) || 0,
        isActive: Boolean(isActive)
      }
    })

    // Log da ação administrativa
    await prisma.adminLog.create({
      data: {
        userId: session.user.id!,
        action: 'CREATE_CREDIT_PACKAGE',
        description: `Created credit package: ${credits} credits for R$ ${price}`,
        metadata: {
          packageId: newPackage.id,
          credits,
          price
        }
      }
    })

    // Limpar cache para refletir mudanças imediatamente
    clearCreditPackagesCache()

    return NextResponse.json({ 
      message: 'Credit package created successfully',
      package: newPackage 
    })
  } catch (error) {
    console.error('Error creating credit package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}