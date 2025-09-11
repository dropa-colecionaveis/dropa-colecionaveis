import { prisma } from './prisma'

/**
 * Calcula o streak atual de um usuário baseado na data atual
 * Diferentemente do currentStreak no banco, este verifica se o streak ainda é válido hoje
 */
export async function calculateCurrentStreak(userId: string): Promise<number> {
  const userStats = await prisma.userStats.findUnique({
    where: { userId },
    select: {
      currentStreak: true,
      lastActivityAt: true
    }
  })

  if (!userStats || !userStats.lastActivityAt) {
    return 0
  }

  const now = new Date()
  
  // Converter para horário de Brasília
  const lastActivityBrasil = new Date(userStats.lastActivityAt.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  }))
  
  const currentBrasil = new Date(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  }))
  
  // Comparar apenas as datas (ano, mês, dia) no fuso de Brasília
  const lastActivityDate = new Date(lastActivityBrasil.getFullYear(), lastActivityBrasil.getMonth(), lastActivityBrasil.getDate())
  const currentDate = new Date(currentBrasil.getFullYear(), currentBrasil.getMonth(), currentBrasil.getDate())
  
  const timeDiff = currentDate.getTime() - lastActivityDate.getTime()
  const daysDifference = Math.floor(timeDiff / (24 * 60 * 60 * 1000))

  // Se a última atividade foi hoje, o streak atual é válido
  if (daysDifference === 0) {
    return userStats.currentStreak || 0
  }

  // Se a última atividade foi ontem, o usuário ainda pode manter o streak se logar hoje
  // Mas como não logou ainda, para o ranking atual o streak é considerado quebrado
  if (daysDifference === 1) {
    // Para ser rigoroso: se passou um dia completo sem logar, streak = 0
    // Mas podemos ser mais flexível e dar até o final do dia para manter
    return 0 // Strict: quebrou o streak por não logar ontem
  }

  // Se passou mais de 1 dia, definitivamente quebrou o streak
  if (daysDifference > 1) {
    return 0
  }

  return 0
}

/**
 * Calcula streaks atuais para múltiplos usuários de forma eficiente
 */
export async function calculateCurrentStreaksForUsers(userIds: string[]): Promise<Record<string, number>> {
  const userStats = await prisma.userStats.findMany({
    where: {
      userId: { in: userIds }
    },
    select: {
      userId: true,
      currentStreak: true,
      lastActivityAt: true
    }
  })

  const now = new Date()
  const currentBrasil = new Date(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  }))
  const currentDate = new Date(currentBrasil.getFullYear(), currentBrasil.getMonth(), currentBrasil.getDate())

  const result: Record<string, number> = {}

  for (const stats of userStats) {
    if (!stats.lastActivityAt) {
      result[stats.userId] = 0
      continue
    }

    const lastActivityBrasil = new Date(stats.lastActivityAt.toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo'
    }))
    
    const lastActivityDate = new Date(lastActivityBrasil.getFullYear(), lastActivityBrasil.getMonth(), lastActivityBrasil.getDate())
    
    const timeDiff = currentDate.getTime() - lastActivityDate.getTime()
    const daysDifference = Math.floor(timeDiff / (24 * 60 * 60 * 1000))

    if (daysDifference === 0) {
      // Última atividade foi hoje, streak é válido
      result[stats.userId] = stats.currentStreak || 0
    } else if (daysDifference === 1) {
      // Última atividade foi ontem, streak quebrado por não logar hoje
      result[stats.userId] = 0
    } else {
      // Mais de 1 dia, definitivamente quebrado
      result[stats.userId] = 0
    }
  }

  // Para usuários não encontrados, retornar 0
  for (const userId of userIds) {
    if (!(userId in result)) {
      result[userId] = 0
    }
  }

  return result
}

/**
 * Verifica se um usuário ainda tem streak ativo (logou hoje)
 */
export async function hasActiveStreakToday(userId: string): Promise<boolean> {
  const streak = await calculateCurrentStreak(userId)
  return streak > 0
}

/**
 * Job para resetar streaks quebrados (pode ser executado diariamente)
 */
export async function resetBrokenStreaks(): Promise<{ updated: number }> {
  console.log('🔄 Checking for broken streaks...')
  
  // Buscar todos os usuários com currentStreak > 0
  const usersWithStreak = await prisma.userStats.findMany({
    where: {
      currentStreak: { gt: 0 }
    },
    select: {
      userId: true,
      currentStreak: true,
      lastActivityAt: true
    }
  })

  console.log(`📊 Found ${usersWithStreak.length} users with active streaks`)

  const now = new Date()
  const currentBrasil = new Date(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  }))
  const currentDate = new Date(currentBrasil.getFullYear(), currentBrasil.getMonth(), currentBrasil.getDate())

  const brokenStreakUserIds: string[] = []

  for (const user of usersWithStreak) {
    if (!user.lastActivityAt) {
      brokenStreakUserIds.push(user.userId)
      continue
    }

    const lastActivityBrasil = new Date(user.lastActivityAt.toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo'
    }))
    
    const lastActivityDate = new Date(lastActivityBrasil.getFullYear(), lastActivityBrasil.getMonth(), lastActivityBrasil.getDate())
    
    const timeDiff = currentDate.getTime() - lastActivityDate.getTime()
    const daysDifference = Math.floor(timeDiff / (24 * 60 * 60 * 1000))

    // Se passou mais de 1 dia sem atividade, resetar streak
    if (daysDifference > 1) {
      brokenStreakUserIds.push(user.userId)
    }
  }

  if (brokenStreakUserIds.length > 0) {
    console.log(`💥 Resetting streaks for ${brokenStreakUserIds.length} users`)
    
    await prisma.userStats.updateMany({
      where: {
        userId: { in: brokenStreakUserIds }
      },
      data: {
        currentStreak: 0
      }
    })

    console.log(`✅ Reset ${brokenStreakUserIds.length} broken streaks`)
  } else {
    console.log('✨ No broken streaks found')
  }

  return { updated: brokenStreakUserIds.length }
}