import { prisma } from './prisma'
import { RankingCategory } from '@prisma/client'
import { performanceMonitor } from './ranking-performance'

export interface GlobalRankingEntry {
  userId: string
  username: string
  position: number
  globalScore: number
  globalPercentage: number
  categoryBreakdown: CategoryBreakdown[]
  totalCategories: number
}

export interface CategoryBreakdown {
  category: RankingCategory
  position: number
  totalInCategory: number
  points: number
  percentage: number
  weight: number
  contribution: number
}

export interface GlobalRankingInfo {
  description: string
  formula: string
  weights: Record<string, number>
  explanation: string[]
}

export class GlobalRankingService {
  // Pesos das categorias para o ranking global
  private readonly CATEGORY_WEIGHTS = {
    TOTAL_XP: 0.30,        // 30% - Experiência total (mais importante)
    COLLECTOR: 0.25,       // 25% - Habilidade de coleção
    PACK_OPENER: 0.20,     // 20% - Abertura de pacotes
    TRADER: 0.15,          // 15% - Atividade no marketplace
    WEEKLY_ACTIVE: 0.05,   // 5% - Atividade semanal
    MONTHLY_ACTIVE: 0.05   // 5% - Atividade mensal
  }

  // Cache for category totals to avoid N+1 queries
  private categoryTotalsCache = new Map<RankingCategory, { total: number, expireAt: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  
  // Cache for full global ranking to avoid recalculation
  private globalRankingCache: { rankings: GlobalRankingEntry[], expireAt: number } | null = null
  private readonly GLOBAL_CACHE_TTL = 3 * 60 * 1000 // 3 minutes

  private async getCachedCategoryTotal(category: RankingCategory): Promise<number> {
    const now = Date.now()
    const cached = this.categoryTotalsCache.get(category)
    
    // Return cached value if still valid
    if (cached && cached.expireAt > now) {
      performanceMonitor.trackCacheHit()
      return cached.total
    }
    
    performanceMonitor.trackCacheMiss()

    // Fetch fresh value
    const total = await prisma.ranking.count({
      where: { 
        category,
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      }
    })

    // Cache the result
    this.categoryTotalsCache.set(category, {
      total,
      expireAt: now + this.CACHE_TTL
    })

    return total
  }

  // Calcular ranking global de todos os usuários
  // Método público para limpar cache
  clearCache(): void {
    this.globalRankingCache = null
    this.categoryTotalsCache.clear()
  }

  async calculateGlobalRanking(): Promise<GlobalRankingEntry[]> {
    return performanceMonitor.trackQueryExecution('calculateGlobalRanking', async () => {
    // Check cache first
    const now = Date.now()
    if (this.globalRankingCache && this.globalRankingCache.expireAt > now) {
      performanceMonitor.trackCacheHit()
      return this.globalRankingCache.rankings
    }
    
    performanceMonitor.trackCacheMiss()
    // 1. Buscar todos os usuários que têm pelo menos um ranking, excluindo admins
    // Optimized with proper index usage
    const usersWithRankings = await prisma.ranking.findMany({
      distinct: ['userId'],
      select: { 
        userId: true,
        user: {
          select: {
            role: true
          }
        }
      },
      where: {
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      }
    })

    const globalRankings: GlobalRankingEntry[] = []

    // 2. Optimized bulk query to get all user rankings at once
    const allUserRankings = await prisma.ranking.findMany({
      where: {
        userId: {
          in: usersWithRankings.map(u => u.userId)
        },
        user: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      },
      select: {
        userId: true,
        category: true,
        position: true,
        value: true,
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { userId: 'asc' }
    })

    // Group rankings by userId for efficient processing
    const rankingsByUser = new Map<string, typeof allUserRankings>()
    for (const ranking of allUserRankings) {
      if (!rankingsByUser.has(ranking.userId)) {
        rankingsByUser.set(ranking.userId, [])
      }
      rankingsByUser.get(ranking.userId)!.push(ranking)
    }

    // 3. Process each user's rankings
    for (const userRef of usersWithRankings) {
      const userId = userRef.userId
      const userRankings = rankingsByUser.get(userId) || []

      if (userRankings.length === 0) continue

      const username = userRankings[0].user.name || userRankings[0].user.email || 'Unknown'

      // Calcular breakdown por categoria
      const categoryBreakdown: CategoryBreakdown[] = []
      let totalWeightedScore = 0
      
      // Mapear rankings do usuário por categoria para facilitar lookup
      const userRankingMap = new Map(
        userRankings.map(ranking => [ranking.category, ranking])
      )

      // Iterar sobre TODAS as categorias possíveis, não apenas as que o usuário tem
      for (const [categoryKey, weight] of Object.entries(this.CATEGORY_WEIGHTS)) {
        const ranking = userRankingMap.get(categoryKey as RankingCategory)
        
        if (ranking) {
          // Usuário tem ranking nesta categoria
          // Para TOTAL_XP, obter posição mais atualizada da API
          let actualPosition = ranking.position
          if (ranking.category === 'TOTAL_XP') {
            try {
              const { rankingService } = await import('./rankings')
              const updatedPosition = await rankingService.getUserPosition(userId, ranking.category)
              if (updatedPosition > 0) {
                actualPosition = updatedPosition
              }
            } catch (error) {
              // Fallback silencioso para posição da tabela ranking
            }
          }
          
          // Use cached totals to avoid N+1 queries
          const totalInCategory = await this.getCachedCategoryTotal(ranking.category)

          // Calcular pontos normalizados (0-1)
          const normalizedPoints = (totalInCategory - actualPosition + 1) / totalInCategory
          const percentage = normalizedPoints * 100
          const contribution = normalizedPoints * weight

          categoryBreakdown.push({
            category: ranking.category,
            position: actualPosition,
            totalInCategory,
            points: normalizedPoints,
            percentage,
            weight,
            contribution
          })

          totalWeightedScore += contribution
        } else {
          // Usuário NÃO tem ranking nesta categoria - contribuição zero
          categoryBreakdown.push({
            category: categoryKey as RankingCategory,
            position: 0, // Não posicionado
            totalInCategory: 0,
            points: 0,
            percentage: 0,
            weight,
            contribution: 0
          })
          
          // totalWeightedScore += 0 (não adiciona nada)
        }
      }

      // Calcular score global final usando a soma TOTAL dos pesos (não apenas os que o usuário tem)
      const totalPossibleWeight = Object.values(this.CATEGORY_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
      const globalScore = totalPossibleWeight > 0 ? totalWeightedScore / totalPossibleWeight : 0
      const globalPercentage = globalScore * 100

      globalRankings.push({
        userId,
        username,
        position: 0, // Será calculado após ordenação
        globalScore,
        globalPercentage,
        categoryBreakdown,
        totalCategories: userRankings.length
      })
    }

    // 3. Ordenar por score global (maior primeiro) e atribuir posições
    globalRankings.sort((a, b) => b.globalScore - a.globalScore)
    globalRankings.forEach((entry, index) => {
      entry.position = index + 1
    })

    // Cache the results
    this.globalRankingCache = {
      rankings: globalRankings,
      expireAt: Date.now() + this.GLOBAL_CACHE_TTL
    }

    return globalRankings
    })
  }

  // Obter informações sobre como o ranking global funciona
  getGlobalRankingInfo(): GlobalRankingInfo {
    return {
      description: "O Ranking Global é calculado baseado na performance em todas as categorias de ranking, usando uma média ponderada que considera diferentes pesos para cada habilidade.",
      formula: "Score Global = Σ(Score_Categoria × Peso_Categoria) / Σ(Pesos)",
      weights: this.CATEGORY_WEIGHTS,
      explanation: [
        "Cada categoria tem um peso diferente baseado na importância:",
        "• Total XP (30%): Experiência acumulada através de conquistas",
        "• Colecionador (25%): Habilidade de coletar itens únicos",
        "• Abridor de Pacotes (20%): Dedicação em abrir pacotes",
        "• Comerciante (15%): Atividade no marketplace",
        "• Ativo Semanal (5%): Consistência de login na semana",
        "• Ativo Mensal (5%): Consistência de login no mês",
        "",
        "Fórmula de cálculo:",
        "1. Para cada categoria: Score = (Total_Jogadores - Posição + 1) / Total_Jogadores",
        "2. Aplicar peso: Contribuição = Score × Peso_Categoria",
        "3. Somar todas as contribuições e dividir pela soma dos pesos",
        "4. Resultado final em percentual (0-100%)"
      ]
    }
  }

  // Obter ranking global com limite
  async getGlobalRanking(limit: number = 100): Promise<GlobalRankingEntry[]> {
    const allRankings = await this.calculateGlobalRanking()
    return allRankings.slice(0, limit)
  }

  // Obter posição global de um usuário específico
  async getUserGlobalPosition(userId: string): Promise<{
    position: number,
    globalScore: number,
    globalPercentage: number,
    categoryBreakdown: CategoryBreakdown[]
  } | null> {
    const allRankings = await this.calculateGlobalRanking()
    const userRanking = allRankings.find(ranking => ranking.userId === userId)
    
    if (!userRanking) return null

    return {
      position: userRanking.position,
      globalScore: userRanking.globalScore,
      globalPercentage: userRanking.globalPercentage,
      categoryBreakdown: userRanking.categoryBreakdown
    }
  }

  // Obter estatísticas do ranking global
  async getGlobalRankingStats(): Promise<{
    totalPlayers: number,
    averageScore: number,
    topPlayer: GlobalRankingEntry | null,
    categoryDistribution: Record<string, number>
  }> {
    const allRankings = await this.calculateGlobalRanking()
    
    if (allRankings.length === 0) {
      return {
        totalPlayers: 0,
        averageScore: 0,
        topPlayer: null,
        categoryDistribution: {}
      }
    }

    const averageScore = allRankings.reduce((sum, ranking) => sum + ranking.globalScore, 0) / allRankings.length
    const topPlayer = allRankings[0]

    // Contar distribuição por número de categorias
    const categoryDistribution: Record<string, number> = {}
    allRankings.forEach(ranking => {
      const key = `${ranking.totalCategories} categorias`
      categoryDistribution[key] = (categoryDistribution[key] || 0) + 1
    })

    return {
      totalPlayers: allRankings.length,
      averageScore,
      topPlayer,
      categoryDistribution
    }
  }
}

export const globalRankingService = new GlobalRankingService()