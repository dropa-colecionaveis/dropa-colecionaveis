import { prisma } from './prisma'
import { RankingCategory } from '@prisma/client'
import { performanceMonitor } from './ranking-performance'

export interface RankingEntry {
  userId: string
  username: string
  position: number
  value: number
  change?: number // mudança de posição desde última atualização
  avatar?: string
}

export interface SeasonInfo {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
}

export class RankingService {
  // Atualizar todos os rankings
  async updateAllRankings(): Promise<void> {
    await Promise.all([
      this.updateRanking('TOTAL_XP'),
      this.updateRanking('PACK_OPENER'),
      this.updateRanking('COLLECTOR'),
      this.updateRanking('TRADER'),
      this.updateRanking('WEEKLY_ACTIVE'),
      this.updateRanking('MONTHLY_ACTIVE')
    ])
  }

  // Atualizar ranking específico
  async updateRanking(category: RankingCategory, seasonId?: string, forceUpdate: boolean = false): Promise<void> {
    if (!forceUpdate) {
      // Verificar se já existe ranking recente para evitar recálculos desnecessários
      const recentRanking = await prisma.ranking.findFirst({
        where: {
          category,
          seasonId: seasonId || null,
          updatedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos atrás
          }
        }
      })

      if (recentRanking) {
        console.log(`⏭️ Skipping ${category} - updated recently`)
        return // Ranking foi atualizado recentemente, não precisa recalcular
      }
    }

    const rankings = await this.calculateRanking(category, seasonId)
    
    // Usar transação para evitar condições de corrida
    await prisma.$transaction(async (tx) => {
      // Limpar rankings anteriores para essa categoria
      if (seasonId) {
        await tx.ranking.deleteMany({
          where: { category, seasonId }
        })
      } else {
        await tx.ranking.deleteMany({
          where: { category, seasonId: null }
        })
      }

      // Inserir novos rankings
      const rankingData = rankings.map((entry, index) => ({
        userId: entry.userId,
        category,
        position: index + 1,
        value: entry.value,
        seasonId
      }))

      if (rankingData.length > 0) {
        await tx.ranking.createMany({
          data: rankingData
        })
      }
    })
  }

  // Calcular ranking baseado na categoria
  private async calculateRanking(category: RankingCategory, seasonId?: string): Promise<Array<{ userId: string, value: number }>> {
    let query: any
    
    switch (category) {
      case 'TOTAL_XP':
        // Para TOTAL_XP, precisamos calcular o XP correto das conquistas
        // em vez de usar o campo totalXP que pode estar desatualizado
        const usersWithAchievements = await this.calculateCorrectTotalXP()
        return usersWithAchievements
          .filter(user => user.value > 0)
          .sort((a, b) => {
            // Primeiro critério: XP em ordem decrescente
            if (a.value !== b.value) {
              return b.value - a.value
            }
            // Critério de desempate: usuários mais antigos primeiro
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })

      case 'PACK_OPENER':
        query = {
          select: {
            userId: true,
            totalPacksOpened: true,
            user: {
              select: {
                createdAt: true
              }
            }
          },
          where: {
            totalPacksOpened: { gt: 0 },
            user: {
              role: {
                notIn: ['ADMIN', 'SUPER_ADMIN']
              }
            }
          },
          orderBy: [
            { totalPacksOpened: 'desc' },
            { user: { createdAt: 'asc' } } // Em caso de empate, usuários mais antigos primeiro
          ]
        }
        break

      case 'COLLECTOR':
        query = {
          select: {
            userId: true,
            totalItemsCollected: true,
            user: {
              select: {
                createdAt: true
              }
            }
          },
          where: {
            totalItemsCollected: { gt: 0 },
            user: {
              role: {
                notIn: ['ADMIN', 'SUPER_ADMIN']
              }
            }
          },
          orderBy: [
            { totalItemsCollected: 'desc' },
            { user: { createdAt: 'asc' } } // Em caso de empate, usuários mais antigos primeiro
          ]
        }
        break

      case 'TRADER':
        query = {
          select: {
            userId: true,
            marketplaceSales: true,
            marketplacePurchases: true,
            user: {
              select: {
                createdAt: true
              }
            }
          },
          where: {
            AND: [
              {
                OR: [
                  { marketplaceSales: { gt: 0 } },
                  { marketplacePurchases: { gt: 0 } }
                ]
              },
              {
                user: {
                  role: {
                    notIn: ['ADMIN', 'SUPER_ADMIN']
                  }
                }
              }
            ]
          },
          orderBy: [
            { marketplaceSales: 'desc' },
            { marketplacePurchases: 'desc' },
            { user: { createdAt: 'asc' } } // Em caso de empate, usuários mais antigos primeiro
          ]
        }
        break

      case 'WEEKLY_ACTIVE':
        // Para o ranking semanal, precisamos calcular streaks atuais dinamicamente
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        // Buscar todos os usuários ativos na última semana
        const weeklyActiveUsers = await prisma.userStats.findMany({
          select: {
            userId: true,
            currentStreak: true,
            lastActivityAt: true,
            user: {
              select: {
                createdAt: true
              }
            }
          },
          where: {
            lastActivityAt: { gte: weekAgo },
            user: {
              role: {
                notIn: ['ADMIN', 'SUPER_ADMIN']
              }
            }
          }
        })

        // Calcular streaks atuais dinamicamente
        const { calculateCurrentStreaksForUsers } = await import('@/lib/streak-calculator')
        const userIds = weeklyActiveUsers.map(u => u.userId)
        const currentStreaks = await calculateCurrentStreaksForUsers(userIds)

        // Filtrar apenas usuários com streak atual > 0 e ordenar
        const validStreakUsers = weeklyActiveUsers
          .map(user => ({
            userId: user.userId,
            value: currentStreaks[user.userId] || 0,
            createdAt: user.user.createdAt
          }))
          .filter(user => user.value > 0)
          .sort((a, b) => {
            // Primeiro critério: streak em ordem decrescente
            if (a.value !== b.value) {
              return b.value - a.value
            }
            // Critério de desempate: usuários mais antigos primeiro
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })

        return validStreakUsers
        break

      case 'MONTHLY_ACTIVE':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        
        query = {
          select: {
            userId: true,
            longestStreak: true,
            lastActivityAt: true,
            user: {
              select: {
                createdAt: true
              }
            }
          },
          where: {
            longestStreak: { gt: 0 }, // Apenas usuários com streak > 0
            lastActivityAt: { gte: monthAgo },
            user: {
              role: {
                notIn: ['ADMIN', 'SUPER_ADMIN']
              }
            }
          },
          orderBy: [
            { longestStreak: 'desc' },
            { user: { createdAt: 'asc' } } // Em caso de empate, usuários mais antigos primeiro
          ]
        }
        break

      default:
        return []
    }

    const results = await prisma.userStats.findMany(query)
    
    return results.map(result => ({
      userId: result.userId,
      value: this.extractValueFromResult(result, category)
    }))
  }

  // Calcular XP correto baseado apenas nas conquistas completadas
  private async calculateCorrectTotalXP(): Promise<Array<{ userId: string, value: number, createdAt: string }>> {
    // Buscar todos os usuários com conquistas completadas, excluindo admins
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        isCompleted: true,
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      },
      include: {
        user: {
          select: {
            createdAt: true
          }
        },
        achievement: {
          select: {
            points: true
          }
        }
      }
    })

    // Agrupar por userId e somar os pontos
    const userXPMap = new Map<string, { xp: number, createdAt: string }>()
    
    for (const ua of userAchievements) {
      const currentData = userXPMap.get(ua.userId) || { xp: 0, createdAt: ua.user.createdAt.toISOString() }
      userXPMap.set(ua.userId, {
        xp: currentData.xp + ua.achievement.points,
        createdAt: currentData.createdAt
      })
    }

    // Converter para array
    return Array.from(userXPMap.entries()).map(([userId, data]) => ({
      userId,
      value: data.xp,
      createdAt: data.createdAt
    }))
  }

  private extractValueFromResult(result: any, category: RankingCategory): number {
    switch (category) {
      case 'TOTAL_XP':
        return result.totalXP || 0
      case 'PACK_OPENER':
        return result.totalPacksOpened || 0
      case 'COLLECTOR':
        return result.totalItemsCollected || 0
      case 'TRADER':
        return (result.marketplaceSales || 0) + (result.marketplacePurchases || 0)
      case 'WEEKLY_ACTIVE':
        return result.currentStreak || 0
      case 'MONTHLY_ACTIVE':
        return result.longestStreak || 0
      default:
        return 0
    }
  }

  // Obter ranking por categoria
  async getRanking(
    category: RankingCategory, 
    limit: number = 100, 
    seasonId?: string
  ): Promise<RankingEntry[]> {
    return performanceMonitor.trackQueryExecution(`getRanking_${category}`, async () => {
    // Use optimized query with explicit index usage
    const rankings = await prisma.ranking.findMany({
      where: {
        category,
        seasonId: seasonId || null,
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      },
      select: {
        userId: true,
        position: true,
        value: true,
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true
          }
        }
      },
      orderBy: { position: 'asc' },
      take: limit
    })

    return rankings.map(ranking => ({
      userId: ranking.userId,
      username: ranking.user.name || ranking.user.email || 'Unknown',
      position: ranking.position,
      value: ranking.value,
      profileImage: ranking.user.profileImage ?? undefined
    }))
    })
  }

  // Obter posição do usuário em um ranking
  async getUserPosition(userId: string, category: RankingCategory, seasonId?: string): Promise<number> {
    // Primeiro tenta buscar na tabela de ranking
    const ranking = await prisma.ranking.findFirst({
      where: {
        userId,
        category,
        seasonId: seasonId || null
      }
    })

    if (ranking) {
      return ranking.position
    }

    // Se não encontrar na tabela de ranking, atualizar dinamicamente e calcular
    await this.updateRanking(category, seasonId)
    
    // Tentar buscar novamente após a atualização
    const updatedRanking = await prisma.ranking.findFirst({
      where: {
        userId,
        category,
        seasonId: seasonId || null
      }
    })

    if (updatedRanking) {
      return updatedRanking.position
    }

    // Se ainda não encontrar, significa que o usuário não se qualifica para este ranking
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    })

    if (!userStats) {
      return 0
    }

    // Verificar se o usuário tem valor válido para essa categoria
    let userValue: number

    switch (category) {
      case 'TOTAL_XP':
        // Calcular XP correto das conquistas
        const { achievementEngine } = await import('@/lib/achievements')
        const userAchievements = await achievementEngine.getUserAchievements(userId)
        userValue = userAchievements
          .filter(ua => ua.isCompleted)
          .reduce((sum, ua) => sum + ua.achievement.points, 0)
        break
      case 'PACK_OPENER':
        userValue = userStats.totalPacksOpened || 0
        break
      case 'COLLECTOR':
        userValue = userStats.totalItemsCollected || 0
        break
      case 'TRADER':
        userValue = (userStats.marketplaceSales || 0) + (userStats.marketplacePurchases || 0)
        break
      case 'WEEKLY_ACTIVE':
        // Calcular streak atual dinamicamente
        const { calculateCurrentStreak } = await import('@/lib/streak-calculator')
        userValue = await calculateCurrentStreak(userId)
        
        // Verificar se foi ativo na última semana E tem streak atual > 0
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        if (!userStats.lastActivityAt || userStats.lastActivityAt < weekAgo || userValue <= 0) {
          return 0 // Não qualificado para ranking semanal
        }
        break
      case 'MONTHLY_ACTIVE':
        userValue = userStats.longestStreak || 0
        // Verificar se foi ativo no último mês E tem streak > 0
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        if (!userStats.lastActivityAt || userStats.lastActivityAt < monthAgo || userValue <= 0) {
          return 0 // Não qualificado para ranking mensal
        }
        break
      default:
        return 0
    }

    // Se o valor for 0 ou menor, usuário não qualifica para ranking
    if (userValue <= 0) {
      return 0
    }

    // Se chegou até aqui, algo deu errado - não deveria acontecer após updateRanking
    console.warn(`User ${userId} should be ranked in ${category} but wasn't found after update`)
    return 0
  }

  // Obter rankings do usuário em todas as categorias
  async getUserRankings(userId: string, seasonId?: string): Promise<Record<string, number>> {
    const rankings = await prisma.ranking.findMany({
      where: {
        userId,
        seasonId
      }
    })

    const result: Record<string, number> = {}
    rankings.forEach(ranking => {
      result[ranking.category] = ranking.position
    })

    return result
  }

  // Obter top players de uma categoria
  async getTopPlayers(
    category: RankingCategory,
    limit: number = 10,
    seasonId?: string
  ): Promise<RankingEntry[]> {
    return await this.getRanking(category, limit, seasonId)
  }

  // Obter ranking ao redor de um usuário específico
  async getRankingAroundUser(
    userId: string,
    category: RankingCategory,
    range: number = 5,
    seasonId?: string
  ): Promise<RankingEntry[]> {
    const userPosition = await this.getUserPosition(userId, category, seasonId)
    
    if (userPosition === 0) return []

    const startPosition = Math.max(1, userPosition - range)
    const endPosition = userPosition + range

    const rankings = await prisma.ranking.findMany({
      where: {
        category,
        seasonId,
        position: {
          gte: startPosition,
          lte: endPosition
        },
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true
          }
        }
      },
      orderBy: { position: 'asc' }
    })

    return rankings.map(ranking => ({
      userId: ranking.userId,
      username: ranking.user.name || ranking.user.email || 'Unknown',
      position: ranking.position,
      value: ranking.value,
      profileImage: ranking.user.profileImage ?? undefined
    }))
  }

  // Gerenciamento de temporadas
  async createSeason(name: string, startDate: Date, endDate: Date, rewards: any = {}): Promise<string> {
    // Desativar temporada atual se existir
    await prisma.season.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    const season = await prisma.season.create({
      data: {
        name,
        startDate,
        endDate,
        isActive: true,
        rewards
      }
    })

    return season.id
  }

  async getActiveSeason(): Promise<SeasonInfo | null> {
    const season = await prisma.season.findFirst({
      where: { isActive: true }
    })

    if (!season) return null

    return {
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive
    }
  }

  async endCurrentSeason(): Promise<void> {
    const currentSeason = await this.getActiveSeason()
    if (!currentSeason) return

    // Marcar temporada como inativa
    await prisma.season.update({
      where: { id: currentSeason.id },
      data: { isActive: false }
    })

    // Aqui você pode adicionar lógica para distribuir prêmios
    await this.distributeSeasonRewards(currentSeason.id)
  }

  private async distributeSeasonRewards(seasonId: string): Promise<void> {
    // Implementar distribuição de prêmios para top players da temporada
    const season = await prisma.season.findUnique({
      where: { id: seasonId }
    })

    if (!season?.rewards) return

    console.log(`Distributing rewards for season: ${season.name}`)
    
    // Aqui você adicionaria lógica para dar prêmios aos top players
    // Por exemplo: créditos extras, itens especiais, badges exclusivos
  }

  // Estatísticas gerais dos rankings
  async getRankingStats(): Promise<any> {
    const totalPlayers = await prisma.userStats.count({
      where: {
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      }
    })
    
    const activePlayers = await prisma.userStats.count({
      where: {
        lastActivityAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // última semana
        },
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      }
    })

    const topXPPlayer = await prisma.userStats.findFirst({
      where: { 
        totalXP: { gt: 0 },
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      },
      orderBy: { totalXP: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true, profileImage: true }
        }
      }
    })

    const topCollector = await prisma.userStats.findFirst({
      where: { 
        totalItemsCollected: { gt: 0 },
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      },
      orderBy: { totalItemsCollected: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true, profileImage: true }
        }
      }
    })

    return {
      totalPlayers,
      activePlayers,
      topXPPlayer: topXPPlayer ? {
        name: topXPPlayer.user.name || topXPPlayer.user.email,
        totalXP: topXPPlayer.totalXP,
        level: Math.floor(Math.sqrt(topXPPlayer.totalXP / 100)) + 1
      } : null,
      topCollector: topCollector ? {
        name: topCollector.user.name || topCollector.user.email,
        totalItems: topCollector.totalItemsCollected
      } : null
    }
  }

  // Obter leaderboard completo para uma página
  async getLeaderboard(
    category: RankingCategory = 'TOTAL_XP',
    page: number = 1,
    limit: number = 50,
    seasonId?: string
  ): Promise<{
    rankings: RankingEntry[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }> {
    const skip = (page - 1) * limit

    const [rankings, total] = await Promise.all([
      prisma.ranking.findMany({
        where: { 
          category, 
          seasonId,
          user: {
            role: {
              notIn: ['ADMIN', 'SUPER_ADMIN']
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              role: true
            }
          }
        },
        orderBy: { position: 'asc' },
        skip,
        take: limit
      }),
      prisma.ranking.count({
        where: { 
          category, 
          seasonId,
          user: {
            role: {
              notIn: ['ADMIN', 'SUPER_ADMIN']
            }
          }
        }
      })
    ])

    const rankingEntries: RankingEntry[] = rankings.map(ranking => ({
      userId: ranking.userId,
      username: ranking.user.name || ranking.user.email,
      position: ranking.position,
      value: ranking.value
    }))

    return {
      rankings: rankingEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Atualizar rankings automaticamente (para ser chamado periodicamente)
  async updateRankingsJob(): Promise<void> {
    console.log('🏆 Updating all rankings...')
    
    const startTime = Date.now()
    
    try {
      await this.updateAllRankings()
      
      const endTime = Date.now()
      console.log(`✅ Rankings updated successfully in ${endTime - startTime}ms`)
    } catch (error) {
      console.error('❌ Error updating rankings:', error)
    }
  }
}

export const rankingService = new RankingService()