import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Lista todas as recompensas diárias configuradas
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const rewards = await prisma.dailyReward.findMany({
      orderBy: [
        { day: 'asc' },
        { rewardType: 'asc' }
      ],
      include: {
        packType: {
          select: {
            id: true,
            name: true,
            displayName: true,
            emoji: true,
            color: true
          }
        },
        _count: {
          select: { claims: true }
        }
      }
    })

    return NextResponse.json({ rewards })
  } catch (error) {
    console.error('Error fetching daily rewards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Cria uma nova recompensa diária
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
    const { day, rewardType, rewardValue, packTypeId, description } = body

    // Validações
    if (!day || !rewardType || !rewardValue || !description) {
      return NextResponse.json(
        { error: 'Day, rewardType, rewardValue and description are required' },
        { status: 400 }
      )
    }

    if (day < 1 || day > 7) {
      return NextResponse.json(
        { error: 'Day must be between 1 and 7' },
        { status: 400 }
      )
    }

    if (!['CREDITS', 'PACK', 'ITEMS'].includes(rewardType)) {
      return NextResponse.json(
        { error: 'Invalid reward type' },
        { status: 400 }
      )
    }

    if (rewardType === 'PACK' && !packTypeId) {
      return NextResponse.json(
        { error: 'Pack type is required for pack rewards' },
        { status: 400 }
      )
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

    const newReward = await prisma.dailyReward.create({
      data: {
        day,
        rewardType,
        rewardValue,
        packTypeId: packTypeId || null,
        description: description.trim(),
        isActive: true
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
        action: 'CREATE_DAILY_REWARD',
        description: `Created daily reward for day ${day}: ${description}`,
        metadata: {
          rewardId: newReward.id,
          day,
          rewardType,
          rewardValue,
          packTypeId
        }
      }
    })

    return NextResponse.json({ 
      message: 'Daily reward created successfully',
      reward: newReward 
    })
  } catch (error) {
    console.error('Error creating daily reward:', error)
    
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