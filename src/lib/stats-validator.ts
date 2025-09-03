import { prisma } from './prisma'

export interface StatInconsistency {
  userId: string
  userName: string | null
  userEmail: string | null
  currentStats: {
    totalPacksOpened: number
    totalItemsCollected: number
  }
  actualData: {
    packOpenings: number
    itemsInInventory: number
  }
  difference: {
    packsDiff: number
    itemsDiff: number
  }
}

export interface XPInconsistency {
  userId: string
  userName: string | null
  userEmail: string | null
  correctXP: number
  storedXP: number
  xpDifference: number
  missingAchievements: string[]
  unlockedAchievements: string[]
}

export class StatsValidator {
  /**
   * Verifica inconsistências nas estatísticas de todos os usuários
   */
  async findInconsistencies(): Promise<StatInconsistency[]> {
    const inconsistencies: StatInconsistency[] = []

    try {
      // Buscar todos os usuários com suas estatísticas
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          userStats: {
            select: {
              totalPacksOpened: true,
              totalItemsCollected: true
            }
          }
        }
      })

      for (const user of users) {
        // Contar dados reais do usuário
        const [actualPackOpenings, actualItems] = await Promise.all([
          prisma.packOpening.count({
            where: { userId: user.id }
          }),
          prisma.userItem.count({
            where: { userId: user.id }
          })
        ])

        const currentStats = user.userStats || {
          totalPacksOpened: 0,
          totalItemsCollected: 0
        }

        const packsDiff = actualPackOpenings - (currentStats.totalPacksOpened || 0)
        const itemsDiff = actualItems - (currentStats.totalItemsCollected || 0)

        // Apenas considerar inconsistência se os stats estão MENORES que a realidade
        // (ter mais itens que packs é normal devido a marketplace, free packs, etc.)
        const hasInconsistency = packsDiff > 0 || itemsDiff > 0
        
        // Mas não é problema ter mais itens que packs - isso é esperado!
        const isProblematic = packsDiff > 0 || (itemsDiff > 0 && actualItems < actualPackOpenings)
        
        if (hasInconsistency && isProblematic) {
          inconsistencies.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            currentStats: {
              totalPacksOpened: currentStats.totalPacksOpened || 0,
              totalItemsCollected: currentStats.totalItemsCollected || 0
            },
            actualData: {
              packOpenings: actualPackOpenings,
              itemsInInventory: actualItems
            },
            difference: {
              packsDiff,
              itemsDiff
            }
          })
        }
      }

      return inconsistencies
    } catch (error) {
      console.error('Error finding stat inconsistencies:', error)
      throw error
    }
  }

  /**
   * Corrige as estatísticas de um usuário específico
   */
  async fixUserStats(userId: string): Promise<boolean> {
    try {
      // Contar dados reais do usuário
      const [totalItems, totalPacks, rareItems, epicItems, legendaryItems] = await Promise.all([
        prisma.userItem.count({ where: { userId } }),
        prisma.packOpening.count({ where: { userId } }),
        prisma.userItem.count({
          where: { 
            userId,
            item: { rarity: 'RARO' }
          }
        }),
        prisma.userItem.count({
          where: { 
            userId,
            item: { rarity: 'EPICO' }
          }
        }),
        prisma.userItem.count({
          where: { 
            userId,
            item: { rarity: 'LENDARIO' }
          }
        })
      ])

      // Atualizar ou criar estatísticas
      await prisma.userStats.upsert({
        where: { userId },
        update: {
          totalItemsCollected: totalItems,
          totalPacksOpened: totalPacks,
          rareItemsFound: rareItems,
          epicItemsFound: epicItems,
          legendaryItemsFound: legendaryItems,
          lastActivityAt: new Date()
        },
        create: {
          userId,
          totalXP: 0,
          level: 1,
          totalItemsCollected: totalItems,
          totalPacksOpened: totalPacks,
          rareItemsFound: rareItems,
          epicItemsFound: epicItems,
          legendaryItemsFound: legendaryItems,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityAt: new Date()
        }
      })

      console.log(`✅ Stats fixed for user ${userId}: ${totalPacks} packs, ${totalItems} items`)
      return true
    } catch (error) {
      console.error(`❌ Error fixing stats for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Corrige as estatísticas de todos os usuários com inconsistências
   */
  async fixAllInconsistencies(): Promise<{ fixed: number, failed: number }> {
    const inconsistencies = await this.findInconsistencies()
    
    if (inconsistencies.length === 0) {
      console.log('✅ No stat inconsistencies found!')
      return { fixed: 0, failed: 0 }
    }

    console.log(`🔄 Found ${inconsistencies.length} users with stat inconsistencies. Fixing...`)

    let fixed = 0
    let failed = 0

    for (const inconsistency of inconsistencies) {
      const success = await this.fixUserStats(inconsistency.userId)
      if (success) {
        fixed++
      } else {
        failed++
      }
    }

    console.log(`🎉 Stats validation complete: ${fixed} fixed, ${failed} failed`)
    return { fixed, failed }
  }

  /**
   * Verifica inconsistências de XP e conquistas
   */
  async findXPInconsistencies(): Promise<XPInconsistency[]> {
    const inconsistencies: XPInconsistency[] = []

    try {
      // Buscar usuários com estatísticas e conquistas
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          userStats: {
            select: {
              totalXP: true,
              totalPacksOpened: true,
              totalItemsCollected: true
            }
          }
        }
      })

      for (const user of users) {
        // Buscar conquistas desbloqueadas do usuário
        const userAchievements = await prisma.userAchievement.findMany({
          where: { 
            userId: user.id,
            isCompleted: true
          },
          include: {
            achievement: {
              select: {
                name: true,
                points: true
              }
            }
          }
        })

        // Calcular XP correto das conquistas desbloqueadas
        const correctXP = userAchievements.reduce((total, ua) => 
          total + (ua.achievement.points || 0), 0
        )
        const storedXP = user.userStats?.totalXP || 0
        const xpDifference = storedXP - correctXP

        // Verificar conquistas esperadas mas não desbloqueadas
        const missingAchievements: string[] = []
        const userStats = user.userStats
        const unlockedAchievementNames = userAchievements.map(ua => ua.achievement.name)
        
        if (userStats) {
          // Verificar conquistas que deveriam estar desbloqueadas baseadas no estado do usuário
          missingAchievements.push(...await this.findMissingAchievements(user.id, userStats, unlockedAchievementNames))
        }

        // Só adicionar à lista se há diferença de XP OU conquistas realmente faltando
        // (não considerar inconsistência apenas por conquistas "faltando" se o XP está correto)
        const hasRealXPInconsistency = Math.abs(xpDifference) > 0
        const hasCriticalMissingAchievements = missingAchievements.length > 0 && hasRealXPInconsistency
        
        if (hasRealXPInconsistency || hasCriticalMissingAchievements) {
          inconsistencies.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            correctXP,
            storedXP,
            xpDifference,
            missingAchievements,
            unlockedAchievements: unlockedAchievementNames
          })
        }
      }

      return inconsistencies
    } catch (error) {
      console.error('Error finding XP inconsistencies:', error)
      throw error
    }
  }

  /**
   * Corrige XP e conquistas de um usuário
   */
  async fixUserXP(userId: string): Promise<boolean> {
    try {
      const { achievementEngine } = await import('./achievements')
      
      // Re-processar conquistas básicas baseadas no estado atual do usuário
      const userStats = await prisma.userStats.findUnique({
        where: { userId }
      })
      
      if (!userStats) return false

      // Simular eventos para desbloquear conquistas perdidas
      if (userStats.totalPacksOpened > 0) {
        await achievementEngine.checkAchievements({
          type: 'PACK_OPENED',
          userId,
          data: { isFirstPack: true },
          timestamp: new Date()
        })
      }

      if (userStats.totalItemsCollected > 0) {
        await achievementEngine.checkAchievements({
          type: 'ITEM_OBTAINED',
          userId,
          data: { isFirstItem: true },
          timestamp: new Date()
        })
      }

      // Recalcular XP baseado nas conquistas desbloqueadas
      const userAchievements = await prisma.userAchievement.findMany({
        where: { 
          userId,
          isCompleted: true
        },
        include: {
          achievement: {
            select: { points: true }
          }
        }
      })

      const correctXP = userAchievements.reduce((total, ua) => 
        total + (ua.achievement.points || 0), 0
      )

      // Atualizar XP nas estatísticas para o valor correto
      await prisma.userStats.update({
        where: { userId },
        data: { totalXP: correctXP }
      })

      console.log(`✅ XP fixed for user ${userId}: ${correctXP} XP`)
      return true
    } catch (error) {
      console.error(`❌ Error fixing XP for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Encontra conquistas que deveriam estar desbloqueadas mas não estão
   */
  private async findMissingAchievements(
    userId: string, 
    userStats: any, 
    unlockedAchievementNames: string[]
  ): Promise<string[]> {
    const missing: string[] = []

    try {
      // Buscar dados adicionais do usuário para validação completa
      const [userData, marketplaceTxs, completedCollections] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { createdAt: true }
        }),
        prisma.marketplaceTransaction.count({
          where: { 
            OR: [
              { buyerId: userId, status: 'COMPLETED' },
              { sellerId: userId, status: 'COMPLETED' }
            ]
          }
        }),
        prisma.userCollection.count({
          where: { userId, completedAt: { not: null } }
        })
      ])

      // 1. MILESTONE ACHIEVEMENTS - Conquistas básicas
      if (!unlockedAchievementNames.includes('Bem-vindo!')) {
        missing.push('Bem-vindo! (+5 XP)')
      }

      if (userStats.totalPacksOpened > 0 && !unlockedAchievementNames.includes('Primeira Abertura')) {
        missing.push('Primeira Abertura (+5 XP)')
      }

      if (userStats.totalItemsCollected > 0 && !unlockedAchievementNames.includes('Primeiro Item')) {
        missing.push('Primeiro Item (+10 XP)')
      }

      // 2. COLLECTOR ACHIEVEMENTS
      if (userStats.totalItemsCollected >= 10 && !unlockedAchievementNames.includes('Colecionador Iniciante')) {
        missing.push('Colecionador Iniciante (+25 XP)')
      }

      if (userStats.totalItemsCollected >= 100 && !unlockedAchievementNames.includes('Colecionador Veterano')) {
        missing.push('Colecionador Veterano (+100 XP)')
      }

      if (completedCollections > 0 && !unlockedAchievementNames.includes('Primeira Coleção')) {
        missing.push('Primeira Coleção (+150 XP)')
      }

      // 3. EXPLORER ACHIEVEMENTS 
      if (userStats.totalPacksOpened >= 10 && !unlockedAchievementNames.includes('Abridor Iniciante')) {
        missing.push('Abridor Iniciante (+25 XP)')
      }

      if (userStats.totalPacksOpened >= 100 && !unlockedAchievementNames.includes('Abridor Experiente')) {
        missing.push('Abridor Experiente (+100 XP)')
      }

      // 4. TRADER ACHIEVEMENTS
      if (userStats.marketplaceSales > 0 && !unlockedAchievementNames.includes('Primeira Venda')) {
        missing.push('Primeira Venda (+20 XP)')
      }

      if (userStats.marketplacePurchases > 0 && !unlockedAchievementNames.includes('Primeira Compra no Marketplace')) {
        missing.push('Primeira Compra no Marketplace (+20 XP)')
      }

      if (marketplaceTxs >= 50 && !unlockedAchievementNames.includes('Comerciante Ativo')) {
        missing.push('Comerciante Ativo (+100 XP)')
      }

      // 5. RARITY ACHIEVEMENTS - baseado em counts das raridades
      if (userStats.rareItemsFound > 0 && !unlockedAchievementNames.includes('Caçador de Raros')) {
        missing.push('Caçador de Raros (+50 XP)')
      }

      if (userStats.epicItemsFound > 0 && !unlockedAchievementNames.includes('Lenda Épica')) {
        missing.push('Lenda Épica (+100 XP)')
      }

      if (userStats.legendaryItemsFound > 0 && !unlockedAchievementNames.includes('Mestre Lendário')) {
        missing.push('Mestre Lendário (+200 XP)')
      }

      // 6. STREAK ACHIEVEMENTS
      if ((userStats.longestStreak || 0) >= 7 && !unlockedAchievementNames.includes('Dedicação Semanal')) {
        missing.push('Dedicação Semanal (+75 XP)')
      }

      if ((userStats.longestStreak || 0) >= 30 && !unlockedAchievementNames.includes('Consistência Mensal')) {
        missing.push('Consistência Mensal (+200 XP)')
      }

      return missing

    } catch (error) {
      console.error('Error finding missing achievements:', error)
      return missing
    }
  }

  /**
   * Valida um usuário específico após uma operação crítica
   */
  async validateUser(userId: string): Promise<void> {
    try {
      const inconsistencies = await this.findInconsistencies()
      const userInconsistency = inconsistencies.find(inc => inc.userId === userId)
      
      if (userInconsistency) {
        console.warn(`⚠️  User ${userId} has stat inconsistencies, auto-fixing...`)
        await this.fixUserStats(userId)
      }
    } catch (error) {
      console.error(`Error validating user ${userId}:`, error)
    }
  }
}

export const statsValidator = new StatsValidator()