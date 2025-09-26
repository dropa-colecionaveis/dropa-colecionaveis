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
    console.log(`[DEBUG] Claiming reward for cycle day: ${cycleDay}, streak: ${currentStreak}`)
    
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

    console.log(`[DEBUG] Found reward:`, {
      id: todayReward?.id,
      day: todayReward?.day,
      type: todayReward?.rewardType,
      packTypeId: todayReward?.packTypeId
    })

    if (!todayReward) {
      return NextResponse.json(
        { error: 'No reward available for today' },
        { status: 404 }
      )
    }

    // Verificar se já foi reclamada para este streakDay (mesma lógica da constraint única)
    const existingClaim = await prisma.dailyRewardClaim.findFirst({
      where: {
        userId,
        rewardId: todayReward.id,
        streakDay: currentStreak
      }
    })

    console.log(`[DEBUG] Checking existing claim for userId=${userId}, rewardId=${todayReward.id}, streakDay=${currentStreak}:`, !!existingClaim)

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Reward already claimed today' },
        { status: 409 }
      )
    }

    // Calcular bônus fixo conforme streak
    let bonusCredits = 0
    let bonusTier = ''
    if (currentStreak >= 31) {
      bonusCredits = 3  // +3 créditos (Ouro)
      bonusTier = 'Ouro'
    } else if (currentStreak >= 15) {
      bonusCredits = 2  // +2 créditos (Prata)
      bonusTier = 'Prata'
    } else if (currentStreak >= 8) {
      bonusCredits = 1  // +1 crédito (Bronze)
      bonusTier = 'Bronze'
    }

    const adjustedValue = todayReward.rewardValue + bonusCredits

    // Processar recompensa em uma transação
    const result = await prisma.$transaction(async (tx) => {
      let rewardDetails: any = {
        type: todayReward.rewardType,
        value: adjustedValue,
        bonusCredits,
        bonusTier,
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
        console.log(`[DEBUG] Searching for pack with customTypeId: ${todayReward.packTypeId}`)
        
        // Buscar um pacote do tipo especificado primeiro
        const availablePack = await tx.pack.findFirst({
          where: {
            customTypeId: todayReward.packTypeId,
            isActive: true
          }
        })

        console.log(`[DEBUG] Found pack:`, {
          id: availablePack?.id,
          name: availablePack?.name,
          customTypeId: availablePack?.customTypeId,
          isActive: availablePack?.isActive
        })

        if (!availablePack) {
          throw new Error(`No available pack found for reward type: ${todayReward.packTypeId}`)
        }

        // Criar concessão de pacote gratuito com packId válido
        const freePackGrant = await tx.freePackGrant.create({
          data: {
            userId,
            packId: availablePack.id,
            claimed: false
          }
        })

        // Atualizar o source para DAILY_REWARD em seguida
        await tx.freePackGrant.update({
          where: { id: freePackGrant.id },
          data: { source: "DAILY_REWARD" }
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