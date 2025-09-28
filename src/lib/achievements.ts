import { prisma } from './prisma'
import { AchievementCategory, AchievementType, Rarity } from '@prisma/client'
import { achievementCache } from './achievement-cache'

export interface GameEvent {
  type: string
  userId: string
  data: any
  timestamp?: Date
}

export interface AchievementCondition {
  type: 'count' | 'value' | 'streak' | 'rarity' | 'collection' | 'time' | 'first' | 'first-purchase' | 'daily_login' | 'daily_streak' | 'daily_rewards_claimed' | 'early_bird' | 'weekend_warrior' | 'comeback'
  target?: number
  rarity?: Rarity
  collectionId?: string
  timeframe?: string // 'daily', 'weekly', 'monthly'
  time_start?: string
  time_end?: string
  weekends_in_month?: number
  previous_streak_min?: number
}

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  type: AchievementType
  conditions: AchievementCondition[]
  points: number
  isSecret?: boolean
}

// Definições das conquistas iniciais
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // COLLECTOR ACHIEVEMENTS
  {
    id: 'first-item',
    name: 'Primeiro Item',
    description: 'Obtenha seu primeiro item colecionável',
    icon: '🎉',
    category: 'COLLECTOR',
    type: 'MILESTONE',
    conditions: [{ type: 'count', target: 1 }],
    points: 10
  },
  {
    id: 'collector-novice',
    name: 'Colecionador Iniciante',
    description: 'Colete 10 itens únicos',
    icon: '📦',
    category: 'COLLECTOR',
    type: 'PROGRESS',
    conditions: [{ type: 'count', target: 10 }],
    points: 25
  },
  {
    id: 'collector-veteran',
    name: 'Colecionador Veterano',
    description: 'Colete 100 itens únicos',
    icon: '🏆',
    category: 'COLLECTOR',
    type: 'PROGRESS',
    conditions: [{ type: 'count', target: 100 }],
    points: 100
  },
  {
    id: 'rare-hunter',
    name: 'Caçador de Raridades',
    description: 'Encontre 10 itens raros ou superiores',
    icon: '💎',
    category: 'COLLECTOR',
    type: 'PROGRESS',
    conditions: [{ type: 'rarity', target: 10, rarity: 'RARO' }],
    points: 50
  },
  {
    id: 'legendary-finder',
    name: 'Encontrador de Lendas',
    description: 'Obtenha seu primeiro item lendário',
    icon: '⭐',
    category: 'COLLECTOR',
    type: 'RARE',
    conditions: [{ type: 'rarity', target: 1, rarity: 'LENDARIO' }],
    points: 100
  },
  {
    id: 'collection-master',
    name: 'Mestre Completista',
    description: 'Complete sua primeira coleção',
    icon: '🎯',
    category: 'COLLECTOR',
    type: 'COLLECTION',
    conditions: [{ type: 'collection', target: 1 }],
    points: 150
  },

  // EXPLORER ACHIEVEMENTS
  {
    id: 'first-pack',
    name: 'Primeira Abertura',
    description: 'Abra seu primeiro pacote',
    icon: '📦',
    category: 'EXPLORER',
    type: 'MILESTONE',
    conditions: [{ type: 'count', target: 1 }],
    points: 5
  },
  {
    id: 'pack-opener-10',
    name: 'Abridor Iniciante',
    description: 'Abra 10 pacotes',
    icon: '📦',
    category: 'EXPLORER',
    type: 'PROGRESS',
    conditions: [{ type: 'count', target: 10 }],
    points: 25
  },
  {
    id: 'pack-opener-100',
    name: 'Abridor Experiente',
    description: 'Abra 100 pacotes',
    icon: '📦',
    category: 'EXPLORER',
    type: 'PROGRESS',
    conditions: [{ type: 'count', target: 100 }],
    points: 100
  },
  {
    id: 'lucky-first',
    name: 'Sortudo de Primeira',
    description: 'Obtenha um item lendário em seu primeiro pacote',
    icon: '🍀',
    category: 'SPECIAL',
    type: 'RARE',
    conditions: [{ type: 'first' }],
    points: 200,
    isSecret: false
  },
  {
    id: 'streak-7',
    name: 'Dedicação Semanal',
    description: 'Abra pacotes por 7 dias consecutivos',
    icon: '🔥',
    category: 'EXPLORER',
    type: 'STREAK',
    conditions: [{ type: 'streak', target: 7 }],
    points: 75
  },

  // TRADER ACHIEVEMENTS
  {
    id: 'first-sale',
    name: 'Primeira Venda',
    description: 'Venda seu primeiro item no marketplace',
    icon: '💰',
    category: 'TRADER',
    type: 'MILESTONE',
    conditions: [{ type: 'count', target: 1 }],
    points: 20
  },
  {
    id: 'first-marketplace-purchase',
    name: 'Primeira Compra no Marketplace',
    description: 'Compre seu primeiro item no marketplace',
    icon: '🛒',
    category: 'TRADER',
    type: 'MILESTONE',
    conditions: [{ type: 'count', target: 1 }],
    points: 20
  },
  {
    id: 'active-trader',
    name: 'Comerciante Ativo',
    description: 'Complete 50 transações no marketplace',
    icon: '📈',
    category: 'TRADER',
    type: 'PROGRESS',
    conditions: [{ type: 'count', target: 50 }],
    points: 100
  },
  {
    id: 'big-profit',
    name: 'Grande Lucro',
    description: 'Venda um item por 5x seu valor base',
    icon: '💎',
    category: 'TRADER',
    type: 'RARE',
    conditions: [{ type: 'value', target: 5 }],
    points: 75
  },
  {
    id: 'marketplace-millionaire',
    name: 'Milionário do Marketplace',
    description: 'Acumule 100,000 créditos em vendas',
    icon: '🏦',
    category: 'TRADER',
    type: 'PROGRESS',
    conditions: [{ type: 'value', target: 100000 }],
    points: 200
  },

  // MILESTONE ACHIEVEMENTS
  {
    id: 'welcome',
    name: 'Bem-vindo!',
    description: 'Crie sua conta na plataforma',
    icon: '👋',
    category: 'MILESTONE',
    type: 'MILESTONE',
    conditions: [{ type: 'first' }],
    points: 5
  },
  {
    id: 'first-credits',
    name: 'Primeira Compra',
    description: 'Compre seus primeiros créditos',
    icon: '💳',
    category: 'MILESTONE',
    type: 'MILESTONE',
    conditions: [{ type: 'first-purchase' }],
    points: 15
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'early-adopter',
    name: 'Pioneiro',
    description: 'Seja um dos primeiros 100 usuários',
    icon: '🚀',
    category: 'SPECIAL',
    type: 'RARE',
    conditions: [{ type: 'count', target: 100 }],
    points: 500,
    isSecret: true
  },
  {
    id: 'night-owl',
    name: 'Coruja Noturna',
    description: 'Abra 50 pacotes entre 22h e 6h',
    icon: '🦉',
    category: 'SPECIAL',
    type: 'PROGRESS',
    conditions: [{ type: 'time', target: 50, timeframe: 'night' }],
    points: 50
  },

  // Daily Login Achievements
  {
    id: 'first-daily-login',
    name: 'Primeira Visita',
    description: 'Faça seu primeiro login diário e ganhe recompensas',
    icon: '🌅',
    category: 'DAILY',
    type: 'MILESTONE',
    conditions: [{ type: 'daily_login', target: 1 }],
    points: 10
  },
  {
    id: 'daily-streak-7',
    name: 'Semana Dedicada',
    description: 'Complete 7 dias consecutivos de login diário',
    icon: '📅',
    category: 'DAILY',
    type: 'STREAK',
    conditions: [{ type: 'daily_streak', target: 7 }],
    points: 25
  },
  {
    id: 'daily-streak-30',
    name: 'Mês Completo',
    description: 'Complete 30 dias consecutivos de login diário',
    icon: '🗓️',
    category: 'DAILY',
    type: 'STREAK',
    conditions: [{ type: 'daily_streak', target: 30 }],
    points: 100
  },
  {
    id: 'daily-streak-100',
    name: 'Centena Lendária',
    description: 'Complete 100 dias consecutivos de login diário',
    icon: '💯',
    category: 'DAILY',
    type: 'STREAK',
    conditions: [{ type: 'daily_streak', target: 100 }],
    points: 500,
    isSecret: true
  },
  {
    id: 'daily-streak-365',
    name: 'Ano Completo',
    description: 'Complete 365 dias consecutivos de login diário',
    icon: '🏆',
    category: 'DAILY',
    type: 'STREAK',
    conditions: [{ type: 'daily_streak', target: 365 }],
    points: 2000,
    isSecret: true
  },
  {
    id: 'daily-rewards-collected',
    name: 'Coletor de Recompensas',
    description: 'Colete 50 recompensas diárias',
    icon: '🎁',
    category: 'DAILY',
    type: 'PROGRESS',
    conditions: [{ type: 'daily_rewards_claimed', target: 50 }],
    points: 75
  },
  {
    id: 'streak-master',
    name: 'Mestre das Sequências',
    description: 'Alcance uma sequência de 50 dias',
    icon: '⚡',
    category: 'DAILY',
    type: 'STREAK',
    conditions: [{ type: 'daily_streak', target: 50 }],
    points: 200
  }
]

export class AchievementEngine {
  // Inicializar conquistas no banco de dados
  async initializeAchievements(): Promise<void> {
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      await prisma.achievement.upsert({
        where: { name: achievement.name },
        update: {
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          type: achievement.type,
          condition: achievement.conditions as any,
          points: achievement.points,
          isSecret: achievement.isSecret || false,
          isActive: true
        },
        create: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          type: achievement.type,
          condition: achievement.conditions as any,
          points: achievement.points,
          isSecret: achievement.isSecret || false,
          isActive: true
        }
      })
    }
  }

  // Verificar conquistas após um evento
  async checkAchievements(event: GameEvent): Promise<string[]> {
    const unlockedAchievements: string[] = []
    
    // Sistema de debug logging
    const debugLog = (message: string, data?: any) => {
      console.log(`🏆 [ACHIEVEMENT DEBUG] ${message}`, data || '')
    }
    
    debugLog(`Processing event: ${event.type} for user ${event.userId}`, {
      eventData: event.data,
      timestamp: event.timestamp
    })
    
    // Buscar conquistas relevantes para o evento
    const relevantAchievements = ACHIEVEMENT_DEFINITIONS.filter(achievement => 
      this.isRelevantForEvent(achievement, event)
    )
    
    debugLog(`Found ${relevantAchievements.length} relevant achievements`, 
      relevantAchievements.map(a => ({ id: a.id, name: a.name }))
    )

    for (const achievementDef of relevantAchievements) {
      const achievement = await prisma.achievement.findFirst({
        where: { name: achievementDef.name, isActive: true }
      })

      if (!achievement) continue

      // Verificar se o usuário já tem essa conquista
      const existingUserAchievement = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: event.userId,
            achievementId: achievement.id
          }
        }
      })

      if (existingUserAchievement?.isCompleted) {
        debugLog(`Skipping ${achievement.name} - already completed`)
        continue
      }

      debugLog(`Evaluating conditions for: ${achievement.name}`)

      // Verificar condições
      const shouldUnlock = await this.checkAchievementConditions(
        achievement,
        achievementDef,
        event
      )

      if (shouldUnlock) {
        debugLog(`🎉 UNLOCKING ACHIEVEMENT: ${achievement.name} for user ${event.userId}`)
        await this.unlockAchievement(event.userId, achievement.id)
        unlockedAchievements.push(achievement.id)
      } else {
        debugLog(`Conditions not met for: ${achievement.name}`)
      }
    }

    return unlockedAchievements
  }

  private isRelevantForEvent(achievement: AchievementDefinition, event: GameEvent): boolean {
    // Verificação específica para "Sortudo de Primeira" - só deve ser ativada por PACK_OPENED
    if (achievement.id === 'lucky-first') {
      return event.type === 'PACK_OPENED'
    }

    // Verificações específicas para conquistas de marketplace
    if (achievement.id === 'first-sale') {
      return event.type === 'MARKETPLACE_SALE'
    }

    if (achievement.id === 'first-marketplace-purchase') {
      return event.type === 'MARKETPLACE_PURCHASE'
    }

    // Conquistas baseadas em vendas apenas
    if (['big-profit', 'marketplace-millionaire'].includes(achievement.id)) {
      return event.type === 'MARKETPLACE_SALE'
    }

    // Active trader é ativada por ambos os tipos de transação
    if (achievement.id === 'active-trader') {
      return event.type === 'MARKETPLACE_SALE' || event.type === 'MARKETPLACE_PURCHASE'
    }

    // Verificação específica para primeira compra de créditos
    if (achievement.id === 'first-credits') {
      return event.type === 'CREDITS_PURCHASED'
    }

    // Verificações específicas para conquistas de daily login
    if (['first-daily-login', 'daily-streak-7', 'daily-streak-30', 'daily-streak-100', 
         'daily-streak-365', 'streak-master'].includes(achievement.id)) {
      return event.type === 'DAILY_LOGIN'
    }

    if (achievement.id === 'daily-rewards-collected') {
      return event.type === 'DAILY_REWARD_CLAIMED'
    }

    // Verificações para conquistas customizadas baseadas em condições
    if (achievement.category === 'DAILY') {
      // Verificar tipo de condição para determinar evento relevante
      const rawConditions = achievement.condition
      let conditions = Array.isArray(rawConditions) ? rawConditions : [rawConditions]
      
      for (const condition of conditions) {
        if (condition?.type === 'early_bird' || condition?.type === 'weekend_warrior') {
          return event.type === 'DAILY_REWARD_CLAIMED'
        }
        if (condition?.type === 'comeback' || condition?.type === 'daily_streak') {
          return event.type === 'DAILY_LOGIN'
        }
      }
    }

    const eventTypeMap: Record<string, AchievementCategory[]> = {
      'USER_REGISTERED': ['MILESTONE'],
      'CREDITS_PURCHASED': ['MILESTONE'],
      'PACK_OPENED': ['EXPLORER', 'COLLECTOR', 'SPECIAL'],
      'ITEM_OBTAINED': ['COLLECTOR'],
      'COLLECTION_COMPLETED': ['COLLECTOR'],
      'MARKETPLACE_SALE': ['TRADER'],
      'MARKETPLACE_PURCHASE': ['TRADER'],
      'DAILY_LOGIN': ['DAILY'],
      'DAILY_REWARD_CLAIMED': ['DAILY']
    }

    return eventTypeMap[event.type]?.includes(achievement.category) || false
  }

  private async checkAchievementConditions(
    achievement: any,
    achievementDef: AchievementDefinition,
    event: GameEvent
  ): Promise<boolean> {
    const rawConditions = achievement.condition
    
    // Tratar tanto arrays quanto objetos simples para compatibilidade
    let conditions: AchievementCondition[]
    if (Array.isArray(rawConditions)) {
      conditions = rawConditions
    } else if (rawConditions && typeof rawConditions === 'object') {
      // Converter objeto único para array
      conditions = [rawConditions]
    } else {
      console.warn(`Invalid conditions format for achievement ${achievement.id}:`, rawConditions)
      return false
    }
    
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, achievement.id, event)
      if (!result) return false
    }

    return true
  }

  private async evaluateCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    switch (condition.type) {
      case 'count':
        return await this.evaluateCountCondition(condition, achievementId, event)
      
      case 'value':
        return await this.evaluateValueCondition(condition, achievementId, event)
      
      case 'rarity':
        return await this.evaluateRarityCondition(condition, achievementId, event)
      
      case 'collection':
        return await this.evaluateCollectionCondition(condition, achievementId, event)
      
      case 'first':
        return await this.evaluateFirstCondition(condition, achievementId, event)
      
      case 'first-purchase':
        return await this.evaluateFirstPurchaseCondition(condition, achievementId, event)
      
      case 'streak':
        return await this.evaluateStreakCondition(condition, achievementId, event)
      
      case 'time':
        return await this.evaluateTimeCondition(condition, achievementId, event)
      
      case 'daily_login':
        return await this.evaluateDailyLoginCondition(condition, achievementId, event)
      
      case 'daily_streak':
        return await this.evaluateDailyStreakCondition(condition, achievementId, event)
      
      case 'daily_rewards_claimed':
        return await this.evaluateDailyRewardsClaimedCondition(condition, achievementId, event)
      
      case 'early_bird':
        return await this.evaluateEarlyBirdCondition(condition, achievementId, event)
      
      case 'weekend_warrior':
        return await this.evaluateWeekendWarriorCondition(condition, achievementId, event)
      
      case 'comeback':
        return await this.evaluateComebackCondition(condition, achievementId, event)
      
      default:
        return false
    }
  }

  private async evaluateCountCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    // Lógica específica baseada no achievement ID e tipo de evento
    let count = 0

    // Para a conquista "Pioneiro" - verificar se usuário está entre os primeiros 100
    if (achievementId === 'early-adopter' && event.type === 'USER_REGISTERED') {
      const user = await prisma.user.findUnique({
        where: { id: event.userId },
        select: { createdAt: true }
      })

      if (user) {
        const userPosition = await prisma.user.count({
          where: { createdAt: { lt: user.createdAt } }
        })
        // Se está entre os primeiros 100 (posições 0-99)
        return userPosition < (condition.target || 100)
      }
      return false
    }

    // Para conquistas de marketplace, verificar especificamente o achievement ID
    if (achievementId === 'first-sale' && event.type === 'MARKETPLACE_SALE') {
      count = await prisma.marketplaceTransaction.count({
        where: { sellerId: event.userId, status: 'COMPLETED' }
      })
    } else if (achievementId === 'first-marketplace-purchase' && event.type === 'MARKETPLACE_PURCHASE') {
      count = await prisma.marketplaceTransaction.count({
        where: { buyerId: event.userId, status: 'COMPLETED' }
      })
    } else {
      // Para outras conquistas, manter lógica original
      switch (event.type) {
        case 'PACK_OPENED':
          count = await prisma.packOpening.count({
            where: { userId: event.userId }
          })
          break
        
        case 'ITEM_OBTAINED':
          // Para a conquista "first-item", verificar especificamente se é o primeiro item
          if (achievementId === 'first-item') {
            count = await prisma.userItem.count({
              where: { userId: event.userId }
            })
          } else {
            // Para outras conquistas de colecionador
            count = await prisma.userItem.count({
              where: { userId: event.userId }
            })
          }
          break
        
        case 'MARKETPLACE_SALE':
          // Para conquistas baseadas em vendas (não primeira compra)
          if (!['first-marketplace-purchase'].includes(achievementId)) {
            if (achievementId === 'active-trader') {
              // Para 'active-trader', contar vendas + compras
              const salesCount = await prisma.marketplaceTransaction.count({
                where: { sellerId: event.userId, status: 'COMPLETED' }
              })
              const purchasesCount = await prisma.marketplaceTransaction.count({
                where: { buyerId: event.userId, status: 'COMPLETED' }
              })
              count = salesCount + purchasesCount
            } else {
              // Para outras conquistas baseadas em vendas
              count = await prisma.marketplaceTransaction.count({
                where: { sellerId: event.userId, status: 'COMPLETED' }
              })
            }
          }
          break
        
        case 'MARKETPLACE_PURCHASE':
          // Para conquistas baseadas em compras (não primeira venda)
          if (!['first-sale', 'big-profit', 'marketplace-millionaire'].includes(achievementId)) {
            if (achievementId === 'active-trader') {
              // Para 'active-trader', contar vendas + compras
              const salesCount = await prisma.marketplaceTransaction.count({
                where: { sellerId: event.userId, status: 'COMPLETED' }
              })
              const purchasesCount = await prisma.marketplaceTransaction.count({
                where: { buyerId: event.userId, status: 'COMPLETED' }
              })
              count = salesCount + purchasesCount
            } else {
              // Para outras conquistas baseadas em compras
              count = await prisma.marketplaceTransaction.count({
                where: { buyerId: event.userId, status: 'COMPLETED' }
              })
            }
          }
          break
      }
    }

    return count >= (condition.target || 1)
  }

  private async evaluateValueCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'MARKETPLACE_SALE' && event.data.priceMultiplier) {
      return event.data.priceMultiplier >= (condition.target || 1)
    }
    
    if (event.type === 'MARKETPLACE_SALE') {
      const totalSales = await prisma.marketplaceTransaction.aggregate({
        _sum: { amount: true },
        where: { sellerId: event.userId, status: 'COMPLETED' }
      })
      return (totalSales._sum.amount || 0) >= (condition.target || 1)
    }

    return false
  }

  private async evaluateRarityCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'ITEM_OBTAINED' && condition.rarity) {
      // Sempre verificar contagem total, não apenas o item atual
      const rarityOrder: Rarity[] = ['COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO']
      const minRarityIndex = rarityOrder.indexOf(condition.rarity)
      
      const count = await prisma.userItem.count({
        where: {
          userId: event.userId,
          item: {
            rarity: {
              in: rarityOrder.slice(minRarityIndex) as Rarity[]
            }
          }
        }
      })
      
      return count >= (condition.target || 1)
    }

    return false
  }

  private async evaluateCollectionCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'COLLECTION_COMPLETED') {
      const completedCollections = await prisma.userCollection.count({
        where: {
          userId: event.userId,
          completedAt: { not: null }
        }
      })
      
      return completedCollections >= (condition.target || 1)
    }

    return false
  }

  private async evaluateFirstCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    switch (event.type) {
      case 'USER_REGISTERED':
        // Conquista "Bem-vindo!" - sempre ativada no registro
        return true
      
      case 'PACK_OPENED':
        // Para a conquista "Sortudo de Primeira" - deve ser apenas para primeiro pacote com lendário
        const isFirstPack = event.data.isFirstPack || false
        const hasLegendary = event.data.items?.some((item: any) => item.rarity === 'LENDARIO') ||
                           event.data.itemRarity === 'LENDARIO' ||
                           event.data.rarity === 'LENDARIO'
        return isFirstPack && hasLegendary
      
      default:
        return false
    }
  }

  private async evaluateFirstPurchaseCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    // Especificamente para compra de créditos
    if (event.type === 'CREDITS_PURCHASED') {
      // Verificar total de compras de créditos do usuário
      const totalPurchases = await prisma.transaction.count({
        where: {
          userId: event.userId,
          type: 'PURCHASE_CREDITS'
        }
      })
      
      // Se há exatamente 1 transação, é a primeira compra
      return totalPurchases === 1
    }
    
    return false
  }

  private async evaluateStreakCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    // Calcular streak atual do usuário
    const userStats = await prisma.userStats.findUnique({
      where: { userId: event.userId }
    })
    
    return (userStats?.currentStreak || 0) >= (condition.target || 1)
  }

  private async evaluateTimeCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (condition.timeframe === 'night') {
      const now = new Date()
      const hour = now.getHours()
      const isNight = hour >= 22 || hour < 6

      if (isNight && event.type === 'PACK_OPENED') {
        // Contar pacotes abertos à noite (considerar últimos 30 dias para performance)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const allPackOpenings = await prisma.packOpening.findMany({
          where: {
            userId: event.userId,
            createdAt: { gte: thirtyDaysAgo }
          },
          select: { createdAt: true }
        })

        // Filtrar apenas os que foram abertos no período noturno
        const nightPacks = allPackOpenings.filter(pack => {
          const packHour = pack.createdAt.getHours()
          return packHour >= 22 || packHour < 6
        })

        return nightPacks.length >= (condition.target || 1)
      }
    }

    return false
  }

  private async evaluateDailyLoginCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    // Para primeira visita, qualquer login diário conta
    if (event.type === 'DAILY_LOGIN') {
      return true
    }
    return false
  }

  private async evaluateDailyStreakCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'DAILY_LOGIN') {
      // Buscar streak atual do usuário
      const userStats = await prisma.userStats.findUnique({
        where: { userId: event.userId }
      })
      
      if (!userStats) return false
      
      return userStats.currentStreak >= (condition.target || 1)
    }
    return false
  }

  private async evaluateDailyRewardsClaimedCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'DAILY_REWARD_CLAIMED') {
      // Contar total de recompensas diárias coletadas
      const claimedCount = await prisma.dailyRewardClaim.count({
        where: { userId: event.userId }
      })
      
      return claimedCount >= (condition.target || 1)
    }
    return false
  }

  private async evaluateEarlyBirdCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'DAILY_REWARD_CLAIMED') {
      const currentTime = new Date()
      const hour = currentTime.getHours()
      const minute = currentTime.getMinutes()
      const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      
      const startTime = condition.time_start || '05:00'
      const endTime = condition.time_end || '07:00'
      
      // Verificar se está no intervalo de tempo (considerando que pode ser dentro do mesmo dia)
      return currentTimeStr >= startTime && currentTimeStr <= endTime
    }
    return false
  }

  private async evaluateWeekendWarriorCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'DAILY_REWARD_CLAIMED') {
      const targetWeekends = condition.weekends_in_month || 4
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      // Verificar se é fim de semana (sábado ou domingo)
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) return false // Não é fim de semana
      
      // Contar claims de fim de semana no mês atual
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
      
      const weekendClaims = await prisma.dailyRewardClaim.findMany({
        where: {
          userId: event.userId,
          claimedAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
      
      // Contar quantos foram em fins de semana
      const weekendClaimsCount = weekendClaims.filter(claim => {
        const claimDay = claim.claimedAt.getDay()
        return claimDay === 0 || claimDay === 6 // Domingo ou sábado
      }).length
      
      return weekendClaimsCount >= targetWeekends
    }
    return false
  }

  private async evaluateComebackCondition(
    condition: AchievementCondition,
    achievementId: string,
    event: GameEvent
  ): Promise<boolean> {
    if (event.type === 'DAILY_LOGIN') {
      const minPreviousStreak = condition.previous_streak_min || 7
      
      // Verificar se o usuário teve um streak anterior de pelo menos X dias e agora está voltando
      const userStats = await prisma.userStats.findUnique({
        where: { userId: event.userId }
      })
      
      if (!userStats) return false
      
      // Verificar se o streak atual é baixo (recomeçou) mas teve um streak alto antes
      // Isso é uma aproximação - idealmente teríamos histórico de streaks
      const currentStreak = userStats.currentStreak
      const longestStreak = userStats.longestStreak || 0
      
      // Se o streak atual é baixo (1-3 dias) mas o maior streak foi significativo
      return currentStreak <= 3 && longestStreak >= minPreviousStreak
    }
    return false
  }

  // Desbloquear conquista
  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    })

    if (!achievement) return

    // Usar transação para garantir atomicidade entre UserAchievement e UserStats
    await prisma.$transaction(async (tx) => {
      // Criar ou atualizar UserAchievement
      await tx.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        },
        update: {
          isCompleted: true,
          unlockedAt: new Date()
        },
        create: {
          userId,
          achievementId,
          isCompleted: true,
          progress: 100
        }
      })

      // Adicionar XP ao usuário na mesma transação
      const userStats = await tx.userStats.upsert({
        where: { userId },
        update: {
          totalXP: { increment: achievement.points },
          updatedAt: new Date()
        },
        create: {
          userId,
          totalXP: achievement.points,
          level: 1,
          lastActivityAt: new Date()
        }
      })

      // Calcular novo nível baseado no XP atualizado
      // Nota: userStats.totalXP ainda contém o valor antigo, então somamos os pontos
      const newTotalXP = userStats.totalXP + achievement.points
      const newLevel = this.calculateLevel(newTotalXP)

      if (newLevel > userStats.level) {
        await tx.userStats.update({
          where: { userId },
          data: { level: newLevel }
        })
      }
    })

    console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.points} XP) for user ${userId}`)
    
    // Invalidar cache quando achievement é desbloqueado
    achievementCache.onAchievementUnlocked(userId)
    
    // Atualizar rankings após conquistar achievement (XP afeta rankings)
    setTimeout(async () => {
      try {
        const { rankingService } = await import('./rankings')
        await rankingService.updateRanking('TOTAL_XP', undefined, true)
      } catch (error) {
        console.error('Error updating ranking after achievement unlock:', error)
      }
    }, 1500)
  }

  // FUNÇÃO REMOVIDA: addXP agora está integrada na transação do unlockAchievement
  // para garantir atomicidade e evitar duplicação de XP

  private calculateLevel(totalXP: number): number {
    // Fórmula: Level = sqrt(XP / 100) + 1
    // Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
    return Math.floor(Math.sqrt(totalXP / 100)) + 1
  }

  // Obter todas as conquistas disponíveis no sistema
  async getAllAchievements(): Promise<any[]> {
    const cached = achievementCache.get('all_achievements')
    if (cached) {
      return cached
    }

    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    })

    // Cache por 15 minutos (conquistas mudam raramente)
    achievementCache.set('all_achievements', achievements, 15 * 60 * 1000)
    
    return achievements
  }

  // Obter conquistas do usuário
  async getUserAchievements(userId: string): Promise<any[]> {
    // Tentar buscar do cache primeiro
    const cached = achievementCache.getUserAchievements(userId)
    if (cached) {
      return cached
    }

    // Se não encontrou no cache, buscar do banco
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    })

    // Salvar no cache por 5 minutos
    achievementCache.setUserAchievements(userId, achievements)
    
    return achievements
  }

  // Obter progresso de conquistas específicas
  async getAchievementProgress(userId: string, achievementId: string): Promise<number> {
    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId
        }
      }
    })

    return userAchievement?.progress || 0
  }

  // Validar e corrigir inconsistências de XP
  async validateAndFixXPConsistency(userId: string): Promise<{
    wasInconsistent: boolean;
    correctedXP?: number;
    previousXP?: number;
  }> {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId, isCompleted: true },
      include: { achievement: true }
    })

    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    })

    if (!userStats) {
      return { wasInconsistent: false }
    }

    const expectedXP = userAchievements.reduce((total, ua) => total + ua.achievement.points, 0)
    const currentXP = userStats.totalXP

    if (currentXP !== expectedXP) {
      const newLevel = this.calculateLevel(expectedXP)
      
      await prisma.userStats.update({
        where: { userId },
        data: {
          totalXP: expectedXP,
          level: newLevel,
          updatedAt: new Date()
        }
      })

      console.log(`🔧 XP inconsistency fixed for user ${userId}: ${currentXP} -> ${expectedXP}`)

      return {
        wasInconsistent: true,
        correctedXP: expectedXP,
        previousXP: currentXP
      }
    }

    return { wasInconsistent: false }
  }
}

export const achievementEngine = new AchievementEngine()