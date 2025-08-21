import { prisma } from './prisma'
import { achievementEngine, GameEvent } from './achievements'
import { rankingService } from './rankings'
import { Rarity } from '@prisma/client'

export interface UserStatsUpdate {
  totalPacksOpened?: number
  totalCreditsSpent?: number
  totalItemsCollected?: number
  collectionsCompleted?: number
  marketplaceSales?: number
  marketplacePurchases?: number
  rareItemsFound?: number
  epicItemsFound?: number
  legendaryItemsFound?: number
}

export class UserStatsService {
  // Inicializar stats para um novo usuário
  async initializeUserStats(userId: string): Promise<void> {
    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      console.warn(`User ${userId} not found, skipping UserStats initialization`)
      return
    }

    await prisma.userStats.upsert({
      where: { userId },
      update: { lastActivityAt: new Date() },
      create: {
        userId,
        totalXP: 0,
        level: 1,
        lastActivityAt: new Date()
      }
    })
  }

  // Atualizar atividade do usuário
  async updateUserActivity(userId: string): Promise<void> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    })

    if (!userStats) {
      await this.initializeUserStats(userId)
      return
    }

    const lastActivity = userStats.lastActivityAt
    const wasActiveToday = lastActivity && lastActivity >= today

    // Atualizar streak se não foi ativo hoje
    if (!wasActiveToday) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let newStreak = 1
      
      // Se foi ativo ontem, continua o streak
      if (lastActivity && lastActivity >= yesterday) {
        newStreak = (userStats.currentStreak || 0) + 1
      }

      // Atualizar longest streak se necessário
      const longestStreak = Math.max(newStreak, userStats.longestStreak || 0)

      await prisma.userStats.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak,
          lastActivityAt: now
        }
      })
    } else {
      // Apenas atualizar última atividade
      await prisma.userStats.update({
        where: { userId },
        data: { lastActivityAt: now }
      })
    }
  }

  // Tracking de abertura de pacotes
  async trackPackOpening(userId: string, packId: string, itemId: string, rarity: Rarity): Promise<void> {
    // Atualizar stats básicas
    await this.updateUserActivity(userId)
    
    const updateData: any = {
      totalPacksOpened: { increment: 1 }
    }

    // Contar itens por raridade
    switch (rarity) {
      case 'RARO':
        updateData.rareItemsFound = { increment: 1 }
        break
      case 'EPICO':
        updateData.epicItemsFound = { increment: 1 }
        updateData.rareItemsFound = { increment: 1 } // Épico também conta como raro
        break
      case 'LENDARIO':
        updateData.legendaryItemsFound = { increment: 1 }
        updateData.epicItemsFound = { increment: 1 }
        updateData.rareItemsFound = { increment: 1 }
        break
    }

    await prisma.userStats.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        totalPacksOpened: 1,
        rareItemsFound: ['RARO', 'EPICO', 'LENDARIO'].includes(rarity) ? 1 : 0,
        epicItemsFound: ['EPICO', 'LENDARIO'].includes(rarity) ? 1 : 0,
        legendaryItemsFound: rarity === 'LENDARIO' ? 1 : 0,
        lastActivityAt: new Date()
      }
    })

    // Trigger achievement check
    const isFirstPack = await this.isFirstPack(userId)
    
    const event: GameEvent = {
      type: 'PACK_OPENED',
      userId,
      data: { packId, itemId, rarity, isFirstPack },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)

    // XP agora vem apenas de achievements, não de ações diretas

    // Trigger ranking update para pack opener após abertura de pacotes
    const packCount = await prisma.userStats.findUnique({
      where: { userId },
      select: { totalPacksOpened: true }
    })
    
    // Atualizar ranking após cada pack opening
    if (packCount && packCount.totalPacksOpened > 0) {
      setTimeout(() => {
        rankingService.updateRanking('PACK_OPENER').catch(console.error)
      }, 1000)
    }
  }

  // Tracking de múltiplas aberturas de pacotes (otimizado para bulk)
  async trackMultiplePackOpenings(
    userId: string, 
    packId: string, 
    items: Array<{ id: string, rarity: Rarity }>
  ): Promise<void> {
    await this.updateUserActivity(userId)
    
    // Calcular totais de raridade
    let rareCount = 0
    let epicCount = 0
    let legendaryCount = 0
    
    items.forEach(item => {
      switch (item.rarity) {
        case 'RARO':
          rareCount++
          break
        case 'EPICO':
          epicCount++
          rareCount++ // Épico também conta como raro
          break
        case 'LENDARIO':
          legendaryCount++
          epicCount++
          rareCount++
          break
      }
    })

    // Atualizar stats em uma única operação
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalPacksOpened: { increment: items.length },
        rareItemsFound: { increment: rareCount },
        epicItemsFound: { increment: epicCount },
        legendaryItemsFound: { increment: legendaryCount }
      },
      create: {
        userId,
        totalPacksOpened: items.length,
        rareItemsFound: rareCount,
        epicItemsFound: epicCount,
        legendaryItemsFound: legendaryCount,
        lastActivityAt: new Date()
      }
    })

    // Verificar se é o primeiro pacote para a achievement "Sortudo de Primeira"
    const wasFirstPack = await this.wasFirstPackBeforeOpening(userId, items.length)
    
    // Trigger achievements para cada item, mas apenas o primeiro pode ser "isFirstPack"
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const isFirstPack = wasFirstPack && i === 0
      
      const event: GameEvent = {
        type: 'PACK_OPENED',
        userId,
        data: { packId, itemId: item.id, rarity: item.rarity, isFirstPack },
        timestamp: new Date()
      }

      await achievementEngine.checkAchievements(event)
    }

    // Trigger ranking update se necessário
    const packCount = await prisma.userStats.findUnique({
      where: { userId },
      select: { totalPacksOpened: true }
    })
    
    if (packCount && packCount.totalPacksOpened > 0) {
      setTimeout(() => {
        rankingService.updateRanking('PACK_OPENER').catch(console.error)
      }, 1000)
    }
  }

  // Tracking de obtenção de item
  async trackItemObtained(userId: string, itemId: string, rarity: Rarity, fromPack: boolean = true): Promise<void> {
    await this.updateUserActivity(userId)
    
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalItemsCollected: { increment: 1 }
      },
      create: {
        userId,
        totalItemsCollected: 1,
        lastActivityAt: new Date()
      }
    })

    // Trigger achievement check
    const event: GameEvent = {
      type: 'ITEM_OBTAINED',
      userId,
      data: { itemId, rarity, fromPack },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)

    // XP agora vem apenas de achievements, não de ações diretas

    // Verificar coleções completadas após obter novo item
    await this.checkAndMarkCompletedCollections(userId)

    // Trigger ranking update para collector
    const itemCount = await prisma.userStats.findUnique({
      where: { userId },
      select: { totalItemsCollected: true }
    })
    
    // Atualizar ranking após cada item obtido
    if (itemCount && itemCount.totalItemsCollected > 0) {
      setTimeout(() => {
        rankingService.updateRanking('COLLECTOR').catch(console.error)
      }, 1000)
    }
  }

  // Tracking de múltiplos itens obtidos (otimizado para bulk)
  async trackMultipleItemsObtained(
    userId: string, 
    items: Array<{ id: string, rarity: Rarity }>, 
    fromPack: boolean = true
  ): Promise<void> {
    await this.updateUserActivity(userId)
    
    // Atualizar stats em uma única operação
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalItemsCollected: { increment: items.length }
      },
      create: {
        userId,
        totalItemsCollected: items.length,
        lastActivityAt: new Date()
      }
    })

    // Trigger achievements para cada item
    for (const item of items) {
      const event: GameEvent = {
        type: 'ITEM_OBTAINED',
        userId,
        data: { itemId: item.id, rarity: item.rarity, fromPack },
        timestamp: new Date()
      }

      await achievementEngine.checkAchievements(event)
    }

    // Verificar coleções completadas após obter novos itens
    await this.checkAndMarkCompletedCollections(userId)

    // Trigger ranking update para collector com múltiplos itens
    const itemCount = await prisma.userStats.findUnique({
      where: { userId },
      select: { totalItemsCollected: true }
    })
    
    if (itemCount && itemCount.totalItemsCollected > 0) {
      setTimeout(() => {
        rankingService.updateRanking('COLLECTOR').catch(console.error)
      }, 1000)
    }
  }

  // Tracking de compra de créditos
  async trackCreditsPurchase(userId: string, amount: number): Promise<void> {
    await this.updateUserActivity(userId)
    
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalCreditsSpent: { increment: amount }
      },
      create: {
        userId,
        totalCreditsSpent: amount,
        lastActivityAt: new Date()
      }
    })

    // Trigger achievement check para primeira compra
    const event: GameEvent = {
      type: 'CREDITS_PURCHASED',
      userId,
      data: { amount },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)
  }

  // Tracking de coleção completada
  async trackCollectionCompleted(userId: string, collectionId: string): Promise<void> {
    await this.updateUserActivity(userId)
    
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        collectionsCompleted: { increment: 1 }
      },
      create: {
        userId,
        collectionsCompleted: 1,
        lastActivityAt: new Date()
      }
    })

    // Trigger achievement check
    const event: GameEvent = {
      type: 'COLLECTION_COMPLETED',
      userId,
      data: { collectionId },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)

    // XP agora vem apenas de achievements, não de ações diretas
  }

  // Tracking de venda no marketplace
  async trackMarketplaceSale(userId: string, itemId: string, price: number, baseValue: number = price): Promise<void> {
    await this.updateUserActivity(userId)
    
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        marketplaceSales: { increment: 1 }
      },
      create: {
        userId,
        marketplaceSales: 1,
        lastActivityAt: new Date()
      }
    })

    // Calcular multiplicador de preço para conquistas
    const priceMultiplier = price / baseValue

    // Trigger achievement check
    const event: GameEvent = {
      type: 'MARKETPLACE_SALE',
      userId,
      data: { itemId, price, baseValue, priceMultiplier },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)

    // XP agora vem apenas de achievements, não de ações diretas
  }

  // Tracking de compra no marketplace
  async trackMarketplacePurchase(userId: string, itemId: string, price: number): Promise<void> {
    await this.updateUserActivity(userId)
    
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        marketplacePurchases: { increment: 1 },
        totalItemsCollected: { increment: 1 } // Incrementar totalItemsCollected ao comprar no marketplace
      },
      create: {
        userId,
        marketplacePurchases: 1,
        totalItemsCollected: 1,
        lastActivityAt: new Date()
      }
    })

    // Trigger achievement check
    const event: GameEvent = {
      type: 'MARKETPLACE_PURCHASE',
      userId,
      data: { itemId, price },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)

    // XP agora vem apenas de achievements, não de ações diretas

    // Verificar coleções completadas após comprar item no marketplace
    await this.checkAndMarkCompletedCollections(userId)
  }

  // Tracking de venda automática
  async trackAutoSell(userId: string, itemId: string, price: number): Promise<void> {
    await this.updateUserActivity(userId)
    
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalItemsCollected: { decrement: 1 } // Decrementar totalItemsCollected ao vender automaticamente
      },
      create: {
        userId,
        totalItemsCollected: 0, // Se não existe stats, criar com 0 já que o item foi vendido
        lastActivityAt: new Date()
      }
    })

    // Trigger achievement check
    const event: GameEvent = {
      type: 'AUTO_SELL',
      userId,
      data: { itemId, price },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)
  }

  // Tracking de registro de usuário
  async trackUserRegistration(userId: string): Promise<void> {
    await this.initializeUserStats(userId)

    // Trigger achievement check para registro
    const event: GameEvent = {
      type: 'USER_REGISTERED',
      userId,
      data: { registeredAt: new Date() },
      timestamp: new Date()
    }

    await achievementEngine.checkAchievements(event)

    // XP inicial removido - o usuário ganha XP através da conquista "Bem-vindo!"
  }

  // Utilitários
  private async isFirstPack(userId: string): Promise<boolean> {
    const packCount = await prisma.packOpening.count({
      where: { userId }
    })
    return packCount === 1
  }

  private async wasFirstPackBeforeOpening(userId: string, packsToOpen: number): Promise<boolean> {
    const packCount = await prisma.packOpening.count({
      where: { userId }
    })
    // Se havia 0 pacotes antes de abrir, então o primeiro pacote desta sessão é o primeiro de todos
    return packCount === 0
  }

  private getPackXP(packId: string): number {
    // Mapear tipos de pack para XP
    // Pode ser melhorado consultando o tipo do pack no banco
    const xpMap: Record<string, number> = {
      'BRONZE': 5,
      'SILVER': 8,
      'GOLD': 15,
      'PLATINUM': 25,
      'DIAMOND': 40
    }
    
    // Para agora, valor padrão
    return 10
  }

  private getItemXP(rarity: Rarity): number {
    const xpMap: Record<Rarity, number> = {
      'COMUM': 2,
      'INCOMUM': 5,
      'RARO': 10,
      'EPICO': 25,
      'LENDARIO': 50
    }
    
    return xpMap[rarity] || 2
  }

  // Obter estatísticas do usuário
  async getUserStats(userId: string): Promise<any> {
    let userStats = await prisma.userStats.findUnique({
      where: { userId }
    })

    if (!userStats) {
      await this.initializeUserStats(userId)
      userStats = await prisma.userStats.findUnique({
        where: { userId }
      })
    }

    return userStats
  }

  // Obter estatísticas de ranking
  async getRankingStats(userId: string): Promise<any> {
    const userStats = await this.getUserStats(userId)
    
    if (!userStats) return null

    // Calcular posições nos rankings
    const totalXPRank = await prisma.userStats.count({
      where: {
        totalXP: { gt: userStats.totalXP }
      }
    }) + 1

    const packOpenerRank = await prisma.userStats.count({
      where: {
        totalPacksOpened: { gt: userStats.totalPacksOpened }
      }
    }) + 1

    const collectorRank = await prisma.userStats.count({
      where: {
        totalItemsCollected: { gt: userStats.totalItemsCollected }
      }
    }) + 1

    const traderRank = await prisma.userStats.count({
      where: {
        marketplaceSales: { gt: userStats.marketplaceSales }
      }
    }) + 1

    return {
      ...userStats,
      rankings: {
        TOTAL_XP: totalXPRank,
        PACK_OPENER: packOpenerRank,
        COLLECTOR: collectorRank,
        TRADER: traderRank
      }
    }
  }

  // Calcular nível baseado em XP
  calculateLevel(totalXP: number): number {
    return Math.floor(Math.sqrt(totalXP / 100)) + 1
  }

  // Calcular XP necessário para próximo nível
  getXPForNextLevel(currentLevel: number): number {
    return (currentLevel * currentLevel - 1) * 100
  }

  // Calcular progresso para próximo nível
  getLevelProgress(totalXP: number): { currentLevel: number, nextLevelXP: number, progress: number } {
    const currentLevel = this.calculateLevel(totalXP)
    const currentLevelXP = ((currentLevel - 1) * (currentLevel - 1)) * 100
    const nextLevelXP = (currentLevel * currentLevel) * 100
    const progressXP = totalXP - currentLevelXP
    const levelXPRange = nextLevelXP - currentLevelXP
    const progress = Math.min(100, (progressXP / levelXPRange) * 100)

    return {
      currentLevel,
      nextLevelXP: nextLevelXP - totalXP,
      progress
    }
  }

  // Verificar e marcar coleções completadas automaticamente
  async checkAndMarkCompletedCollections(userId: string): Promise<void> {
    try {
      // Buscar todas as coleções ativas
      const collections = await prisma.collection.findMany({
        where: { isActive: true },
        include: { items: true }
      })

      for (const collection of collections) {
        // Verificar se o usuário já tem essa coleção marcada como completada
        const existingUserCollection = await prisma.userCollection.findUnique({
          where: {
            userId_collectionId: {
              userId,
              collectionId: collection.id
            }
          }
        })

        // Se já está marcada como completada, pular
        if (existingUserCollection?.completedAt) {
          continue
        }

        // Contar itens únicos que o usuário possui desta coleção
        const userItemIds = await prisma.userItem.findMany({
          where: {
            userId,
            item: {
              collectionId: collection.id
            }
          },
          distinct: ['itemId'],
          select: { itemId: true }
        })

        const uniqueItemsOwned = userItemIds.length
        const totalItems = collection.items.length

        // Verificar se a coleção está completa
        if (uniqueItemsOwned === totalItems && totalItems > 0) {
          // Marcar como completada
          await prisma.userCollection.upsert({
            where: {
              userId_collectionId: {
                userId,
                collectionId: collection.id
              }
            },
            update: {
              completedAt: new Date(),
              itemsOwned: uniqueItemsOwned
            },
            create: {
              userId,
              collectionId: collection.id,
              itemsOwned: uniqueItemsOwned,
              completedAt: new Date()
            }
          })

          // Tracking de coleção completada
          await this.trackCollectionCompleted(userId, collection.id)

          console.log(`✅ Collection "${collection.name}" completed for user ${userId}`)
        }
      }
    } catch (error) {
      console.error('Error checking completed collections:', error)
    }
  }
}

export const userStatsService = new UserStatsService()