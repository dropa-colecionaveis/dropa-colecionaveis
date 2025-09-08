import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// PUT - Atualiza um tipo de pacote
export async function PUT(
  request: Request,
  { params }: { params: { typeId: string } }
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
    const { name, displayName, emoji, color, description, isActive } = body

    // Buscar tipo atual
    const currentType = await prisma.packTypeCustom.findUnique({
      where: { id: params.typeId }
    })

    if (!currentType) {
      return NextResponse.json(
        { error: 'Pack type not found' },
        { status: 404 }
      )
    }

    // Validações
    if (name && !displayName) {
      return NextResponse.json(
        { error: 'DisplayName is required when updating name' },
        { status: 400 }
      )
    }

    let normalizedName = currentType.name
    if (name) {
      normalizedName = name.toUpperCase().replace(/\s+/g, '_')
      
      // Verificar duplicatas (excluindo o tipo atual)
      const existing = await prisma.packTypeCustom.findFirst({
        where: { 
          name: normalizedName,
          id: { not: params.typeId }
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A pack type with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedType = await prisma.packTypeCustom.update({
      where: { id: params.typeId },
      data: {
        ...(name && { name: normalizedName }),
        ...(displayName && { displayName: displayName.trim() }),
        ...(emoji !== undefined && { emoji }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    })

    // Log da ação administrativa
    await prisma.adminLog.create({
      data: {
        userId: session.user.id!,
        action: 'UPDATE_PACK_TYPE',
        description: `Updated pack type: ${updatedType.displayName}`,
        metadata: {
          packTypeId: updatedType.id,
          changes: body,
          previousValues: {
            name: currentType.name,
            displayName: currentType.displayName,
            emoji: currentType.emoji,
            color: currentType.color,
            description: currentType.description,
            isActive: currentType.isActive
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Pack type updated successfully',
      packType: updatedType 
    })
  } catch (error) {
    console.error('Error updating pack type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove/desativa um tipo de pacote
export async function DELETE(
  request: Request,
  { params }: { params: { typeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const packType = await prisma.packTypeCustom.findUnique({
      where: { id: params.typeId },
      include: {
        _count: {
          select: { packs: true }
        }
      }
    })

    if (!packType) {
      return NextResponse.json(
        { error: 'Pack type not found' },
        { status: 404 }
      )
    }

    // Não permitir deletar tipos padrão
    if (packType.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default pack types' },
        { status: 400 }
      )
    }

    // Se tem pacotes associados, apenas desativar
    if (packType._count.packs > 0) {
      const updatedType = await prisma.packTypeCustom.update({
        where: { id: params.typeId },
        data: { isActive: false }
      })

      await prisma.adminLog.create({
        data: {
          userId: session.user.id!,
          action: 'DEACTIVATE_PACK_TYPE',
          description: `Deactivated pack type with packs: ${packType.displayName}`,
          metadata: {
            packTypeId: params.typeId,
            packsCount: packType._count.packs
          }
        }
      })

      return NextResponse.json({ 
        message: 'Pack type deactivated (has associated packs)',
        packType: updatedType 
      })
    } else {
      // Se não tem pacotes, pode deletar completamente
      await prisma.packTypeCustom.delete({
        where: { id: params.typeId }
      })

      await prisma.adminLog.create({
        data: {
          userId: session.user.id!,
          action: 'DELETE_PACK_TYPE',
          description: `Deleted pack type: ${packType.displayName}`,
          metadata: {
            packTypeId: params.typeId,
            name: packType.name,
            displayName: packType.displayName
          }
        }
      })

      return NextResponse.json({ 
        message: 'Pack type deleted successfully' 
      })
    }
  } catch (error) {
    console.error('Error deleting pack type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}