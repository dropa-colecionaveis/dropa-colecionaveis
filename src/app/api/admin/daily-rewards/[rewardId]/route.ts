import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// PUT - Atualiza uma recompensa diária
export async function PUT(
  request: Request,
  { params }: { params: { rewardId: string } }
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
    const { day, rewardType, rewardValue, packTypeId, description, isActive } = body

    // Buscar recompensa atual
    const currentReward = await prisma.dailyReward.findUnique({
      where: { id: params.rewardId }
    })

    if (!currentReward) {
      return NextResponse.json(
        { error: 'Daily reward not found' },
        { status: 404 }
      )
    }

    // Validações
    if (day !== undefined && (day < 1 || day > 7)) {
      return NextResponse.json(
        { error: 'Day must be between 1 and 7' },
        { status: 400 }
      )
    }

    if (rewardType !== undefined && !['CREDITS', 'PACK', 'ITEMS'].includes(rewardType)) {
      return NextResponse.json(
        { error: 'Invalid reward type' },
        { status: 400 }
      )
    }

    if ((rewardType === 'PACK' || currentReward.rewardType === 'PACK') && rewardType !== 'CREDITS') {
      if (!packTypeId && rewardType === 'PACK') {
        return NextResponse.json(
          { error: 'Pack type is required for pack rewards' },
          { status: 400 }
        )
      }
    }

    // Verificar se pack type existe (se necessário)
    if (packTypeId) {
      const packType = await prisma.packTypeCustom.findUnique({
        where: { id: packTypeId }
      })
      
      if (!packType || !packType.isActive) {
        return NextResponse.json(
          { error: 'Invalid or inactive pack type' },
          { status: 400 }
        )
      }
    }

    const updatedReward = await prisma.dailyReward.update({
      where: { id: params.rewardId },
      data: {
        ...(day !== undefined && { day }),
        ...(rewardType !== undefined && { rewardType }),
        ...(rewardValue !== undefined && { rewardValue }),
        ...(packTypeId !== undefined && { packTypeId }),
        ...(description !== undefined && { description: description.trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      },
      include: {
        packType: {
          select: {
            id: true,
            name: true,
            displayName: true,
            emoji: true,
            color: true
          }
        }
      }
    })

    // Log da ação administrativa
    await prisma.adminLog.create({
      data: {
        userId: session.user.id!,
        action: 'UPDATE_DAILY_REWARD',
        description: `Updated daily reward: ${updatedReward.description}`,
        metadata: {
          rewardId: updatedReward.id,
          changes: body,
          previousValues: {
            day: currentReward.day,
            rewardType: currentReward.rewardType,
            rewardValue: currentReward.rewardValue,
            packTypeId: currentReward.packTypeId,
            description: currentReward.description,
            isActive: currentReward.isActive
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Daily reward updated successfully',
      reward: updatedReward 
    })
  } catch (error) {
    console.error('Error updating daily reward:', error)
    
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A reward for this day and type already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove uma recompensa diária
export async function DELETE(
  request: Request,
  { params }: { params: { rewardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const reward = await prisma.dailyReward.findUnique({
      where: { id: params.rewardId },
      include: {
        _count: {
          select: { claims: true }
        }
      }
    })

    if (!reward) {
      return NextResponse.json(
        { error: 'Daily reward not found' },
        { status: 404 }
      )
    }

    // Se tem claims, apenas desativar ao invés de deletar
    if (reward._count.claims > 0) {
      const updatedReward = await prisma.dailyReward.update({
        where: { id: params.rewardId },
        data: { isActive: false }
      })

      await prisma.adminLog.create({
        data: {
          userId: session.user.id!,
          action: 'DEACTIVATE_DAILY_REWARD',
          description: `Deactivated daily reward with claims: ${reward.description}`,
          metadata: {
            rewardId: params.rewardId,
            claimsCount: reward._count.claims
          }
        }
      })

      return NextResponse.json({ 
        message: 'Daily reward deactivated (has associated claims)',
        reward: updatedReward 
      })
    } else {
      // Se não tem claims, pode deletar completamente
      await prisma.dailyReward.delete({
        where: { id: params.rewardId }
      })

      await prisma.adminLog.create({
        data: {
          userId: session.user.id!,
          action: 'DELETE_DAILY_REWARD',
          description: `Deleted daily reward: ${reward.description}`,
          metadata: {
            rewardId: params.rewardId,
            day: reward.day,
            rewardType: reward.rewardType,
            rewardValue: reward.rewardValue
          }
        }
      })

      return NextResponse.json({ 
        message: 'Daily reward deleted successfully' 
      })
    }
  } catch (error) {
    console.error('Error deleting daily reward:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}