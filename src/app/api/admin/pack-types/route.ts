import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Lista todos os tipos de pacotes
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const packTypes = await prisma.packTypeCustom.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { displayName: 'asc' }
      ],
      include: {
        _count: {
          select: { packs: true }
        }
      }
    })

    return NextResponse.json({ packTypes })
  } catch (error) {
    console.error('Error fetching pack types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Cria um novo tipo de pacote
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
    const { name, displayName, emoji, color, description } = body

    // Validações
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      )
    }

    // Converter nome para uppercase e remover espaços
    const normalizedName = name.toUpperCase().replace(/\s+/g, '_')

    // Verificar se já existe
    const existing = await prisma.packTypeCustom.findUnique({
      where: { name: normalizedName }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A pack type with this name already exists' },
        { status: 409 }
      )
    }

    const newPackType = await prisma.packTypeCustom.create({
      data: {
        name: normalizedName,
        displayName: displayName.trim(),
        emoji: emoji || '📦',
        color: color || '#6b7280',
        description: description?.trim() || null,
        isDefault: false
      }
    })

    // Log da ação administrativa
    await prisma.adminLog.create({
      data: {
        userId: session.user.id!,
        action: 'CREATE_PACK_TYPE',
        description: `Created pack type: ${displayName} (${normalizedName})`,
        metadata: {
          packTypeId: newPackType.id,
          name: normalizedName,
          displayName
        }
      }
    })

    return NextResponse.json({ 
      message: 'Pack type created successfully',
      packType: newPackType 
    })
  } catch (error) {
    console.error('Error creating pack type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}