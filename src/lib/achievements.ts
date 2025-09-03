import { prisma } from './prisma'
import { AchievementCategory, AchievementType, Rarity } from '@prisma/client'

export interface GameEvent {
  type: string
  userId: string
  data: any
  timestamp?: Date
}

export interface AchievementCondition {
  type: 'count' | 'value' | 'streak' | 'rarity' | 'collection' | 'time' | 'first' | 'first-purchase'
  target?: number
  rarity?: Rarity
  collectionId?: string
  timeframe?: string // 'daily', 'weekly', 'monthly'
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
    
    // Buscar conquistas relevantes para o evento
    const relevantAchievements = ACHIEVEMENT_DEFINITIONS.filter(achievement => 
      this.isRelevantForEvent(achievement, event)
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

      if (existingUserAchievement?.isCompleted) continue

      // Verificar condições
      const shouldUnlock = await this.checkAchievementConditions(
        achievement,
        achievementDef,
        event
      )

      if (shouldUnlock) {
        await this.unlockAchievement(event.userId, achievement.id)
        unlockedAchievements.push(achievement.id)
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

    const eventTypeMap: Record<string, AchievementCategory[]> = {
      'USER_REGISTERED': ['MILESTONE'],
      'CREDITS_PURCHASED': ['MILESTONE'],
      'PACK_OPENED': ['EXPLORER', 'COLLECTOR', 'SPECIAL'],
      'ITEM_OBTAINED': ['COLLECTOR'],
      'COLLECTION_COMPLETED': ['COLLECTOR'],
      'MARKETPLACE_SALE': ['TRADER'],
      'MARKETPLACE_PURCHASE': ['TRADER']
    }

    return eventTypeMap[event.type]?.includes(achievement.category) || false
  }

  private async checkAchievementConditions(
    achievement: any,
    achievementDef: AchievementDefinition,
    event: GameEvent
  ): Promise<boolean> {
    const conditions = achievement.condition as AchievementCondition[]
    
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
        const hasLegendary = event.data.items?.some((item: any) => item.rarity === 'LENDARIO') || false
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
      const hour = new Date().getHours()
      const isNight = hour >= 22 || hour < 6
      
      if (isNight && event.type === 'PACK_OPENED') {
        // Contar pacotes abertos à noite
        const nightPacks = await prisma.packOpening.count({
          where: {
            userId: event.userId,
            createdAt: {
              gte: new Date(new Date().setHours(22, 0, 0, 0)),
              lte: new Date(new Date().setHours(6, 0, 0, 0))
            }
          }
        })
        
        return nightPacks >= (condition.target || 1)
      }
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

      // Calcular novo nível baseado em XP
      const newLevel = this.calculateLevel(userStats.totalXP + achievement.points)
      
      if (newLevel > userStats.level) {
        await tx.userStats.update({
          where: { userId },
          data: { level: newLevel }
        })
      }
    })

    console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.points} XP) for user ${userId}`)
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
    return await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    })
  }

  // Obter conquistas do usuário
  async getUserAchievements(userId: string): Promise<any[]> {
    return await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    })
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