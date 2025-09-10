import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST - Reivindica a recompensa diária do usuário
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const today = new Date()

    // Buscar stats do usuário
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    })

    if (!userStats) {
      return NextResponse.json(
        { error: 'User stats not found' },
        { status: 404 }
      )
    }

    const currentStreak = userStats.currentStreak || 1
    const cycleDay = ((currentStreak - 1) % 7) + 1

    // Buscar recompensa de hoje
    const todayReward = await prisma.dailyReward.findFirst({
      where: { 
        day: cycleDay,
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

    if (!todayReward) {
      return NextResponse.json(
        { error: 'No reward available for today' },
        { status: 404 }
      )
    }

    // Verificar se já foi reclamada hoje
    const todayBrasil = new Date(today.toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo'
    }))
    
    const startOfDay = new Date(todayBrasil.getFullYear(), todayBrasil.getMonth(), todayBrasil.getDate(), 0, 0, 0)
    const endOfDay = new Date(todayBrasil.getFullYear(), todayBrasil.getMonth(), todayBrasil.getDate(), 23, 59, 59, 999)
    
    // Converter para UTC
    const startOfDayUTC = new Date(startOfDay.getTime() + (3 * 60 * 60 * 1000))
    const endOfDayUTC = new Date(endOfDay.getTime() + (3 * 60 * 60 * 1000))
    
    const existingClaim = await prisma.dailyRewardClaim.findFirst({
      where: {
        userId,
        rewardId: todayReward.id,
        claimedAt: {
          gte: startOfDayUTC,
          lte: endOfDayUTC
        }
      }
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Reward already claimed today' },
        { status: 409 }
      )
    }

    // Calcular multiplicador de bonus
    let bonusMultiplier = 1
    if (currentStreak >= 31) {
      bonusMultiplier = 1.3
    } else if (currentStreak >= 15) {
      bonusMultiplier = 1.2
    } else if (currentStreak >= 8) {
      bonusMultiplier = 1.1
    }

    const adjustedValue = Math.floor(todayReward.rewardValue * bonusMultiplier)

    // Processar recompensa em uma transação
    const result = await prisma.$transaction(async (tx) => {
      let rewardDetails: any = {
        type: todayReward.rewardType,
        value: adjustedValue,
        bonusMultiplier,
        originalValue: todayReward.rewardValue
      }

      // Processar baseado no tipo de recompensa
      if (todayReward.rewardType === 'CREDITS') {
        // Adicionar créditos ao usuário
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: { increment: adjustedValue }
          }
        })

        // Registrar transação
        await tx.transaction.create({
          data: {
            userId,
            type: 'ADMIN_CREDIT_GRANT',
            amount: adjustedValue,
            description: `Recompensa diária: ${adjustedValue} créditos (dia ${cycleDay} do streak)`
          }
        })

        rewardDetails.credits = adjustedValue

      } else if (todayReward.rewardType === 'PACK') {
        // Criar concessão de pacote gratuito
        const freePackGrant = await tx.freePackGrant.create({
          data: {
            userId,
            packId: '', // Será preenchido depois
            claimed: false
          }
        })

        // Buscar um pacote do tipo especificado
        const availablePack = await tx.pack.findFirst({
          where: {
            customTypeId: todayReward.packTypeId,
            isActive: true
          }
        })

        if (!availablePack) {
          throw new Error('No available pack for reward type')
        }

        // Atualizar o grant com o pack correto
        await tx.freePackGrant.update({
          where: { id: freePackGrant.id },
          data: { packId: availablePack.id }
        })

        rewardDetails.pack = {
          id: availablePack.id,
          name: availablePack.name,
          type: todayReward.packType
        }
        rewardDetails.freePackGrantId = freePackGrant.id
      }

      // Criar claim da recompensa
      const claim = await tx.dailyRewardClaim.create({
        data: {
          userId,
          rewardId: todayReward.id,
          streakDay: currentStreak,
          rewardReceived: rewardDetails
        }
      })

      return {
        claim,
        reward: todayReward,
        rewardDetails,
        currentStreak,
        cycleDay,
        bonusMultiplier
      }
    })

    // Processar achievements em background
    setImmediate(async () => {
      try {
        const { achievementEngine } = await import('@/lib/achievements')
        
        await achievementEngine.checkAchievements({
          type: 'DAILY_REWARD_CLAIMED',
          userId,
          data: {
            day: cycleDay,
            streak: currentStreak,
            rewardType: todayReward.rewardType,
            value: adjustedValue,
            bonusMultiplier
          }
        })

        // Achievements de streak são processados automaticamente pelo updateUserActivity
        // quando o usuário faz login diário
      } catch (achievementError) {
        console.error('Error processing daily reward achievements:', achievementError)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Reward claimed successfully!',
      reward: {
        type: todayReward.rewardType,
        description: todayReward.description,
        value: adjustedValue,
        originalValue: todayReward.rewardValue,
        bonusMultiplier,
        details: result.rewardDetails
      },
      currentStreak,
      cycleDay,
      claimedAt: result.claim.claimedAt
    })

  } catch (error) {
    console.error('Error claiming daily reward:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}