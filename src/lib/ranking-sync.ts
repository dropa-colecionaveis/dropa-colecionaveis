import { prisma } from './prisma'

export class RankingSyncService {
  /**
   * Sincroniza usuários que deveriam estar nos rankings mas não estão
   * Útil para corrigir inconsistências após correções manuais
   */
  async syncStreakRankings(): Promise<void> {
    console.log('🔄 Sincronizando rankings de streak...')
    
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // Encontrar usuários elegíveis que não estão nos rankings
      const eligibleUsers = await prisma.userStats.findMany({
        where: {
          currentStreak: { gt: 0 },
          lastActivityAt: { gte: weekAgo },
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
              email: true,
              role: true,
              rankings: {
                where: {
                  category: {
                    in: ['WEEKLY_ACTIVE', 'MONTHLY_ACTIVE']
                  },
                  seasonId: null
                }
              }
            }
          }
        }
      })
      
      const inconsistencies: string[] = []
      
      for (const userStat of eligibleUsers) {
        const weeklyRanking = userStat.user.rankings.find(r => r.category === 'WEEKLY_ACTIVE')
        const monthlyRanking = userStat.user.rankings.find(r => r.category === 'MONTHLY_ACTIVE')
        
        // Verificar se deveria estar em WEEKLY_ACTIVE mas não está
        if (!weeklyRanking && userStat.lastActivityAt && userStat.lastActivityAt >= weekAgo) {
          inconsistencies.push(`${userStat.user.email} deve estar em WEEKLY_ACTIVE`)
        }
        
        // Verificar se deveria estar em MONTHLY_ACTIVE mas não está
        if (!monthlyRanking && userStat.lastActivityAt && userStat.lastActivityAt >= monthAgo) {
          inconsistencies.push(`${userStat.user.email} deve estar em MONTHLY_ACTIVE`)
        }
      }
      
      if (inconsistencies.length > 0) {
        console.log('⚠️ Inconsistências detectadas:')
        inconsistencies.forEach(issue => console.log(`  - ${issue}`))
        
        // Forçar recálculo dos rankings de streak
        const { rankingService } = await import('./rankings')
        
        console.log('🔄 Recalculando rankings de streak...')
        await Promise.all([
          rankingService.updateRanking('WEEKLY_ACTIVE', undefined, true),
          rankingService.updateRanking('MONTHLY_ACTIVE', undefined, true)
        ])
        
        console.log('✅ Rankings de streak recalculados')
        
        // Invalidar cache
        try {
          const { revalidateTag } = await import('next/cache')
          revalidateTag('rankings-WEEKLY_ACTIVE')
          revalidateTag('rankings-MONTHLY_ACTIVE')
          console.log('✅ Cache invalidado')
        } catch (error) {
          console.warn('⚠️ Falha ao invalidar cache:', error)
        }
        
      } else {
        console.log('✅ Nenhuma inconsistência detectada nos rankings de streak')
      }
      
    } catch (error) {
      console.error('❌ Erro na sincronização de rankings:', error)
      throw error
    }
  }
  
  /**
   * Verifica e corrige streaks zerados para usuários ativos recentes
   */
  async fixZeroStreaksForActiveUsers(): Promise<void> {
    console.log('🔄 Verificando streaks zerados...')
    
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Encontrar usuários com streak=0 mas ativos recentemente
      const activeUsersWithZeroStreak = await prisma.userStats.findMany({
        where: {
          currentStreak: 0,
          lastActivityAt: { gte: weekAgo },
          user: {
            role: {
              notIn: ['ADMIN', 'SUPER_ADMIN']
            },
            createdAt: { gte: today } // Apenas usuários criados hoje
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true
            }
          }
        }
      })
      
      if (activeUsersWithZeroStreak.length > 0) {
        console.log(`⚠️ Encontrados ${activeUsersWithZeroStreak.length} usuários novos com streak=0:`)
        
        for (const userStat of activeUsersWithZeroStreak) {
          console.log(`  - Corrigindo ${userStat.user.email}`)
          
          await prisma.userStats.update({
            where: { userId: userStat.userId },
            data: {
              currentStreak: 1,
              longestStreak: Math.max(1, userStat.longestStreak),
              lastActivityAt: now
            }
          })
        }
        
        console.log('✅ Streaks corrigidos')
        
        // Recalcular rankings após correções
        await this.syncStreakRankings()
        
      } else {
        console.log('✅ Nenhum streak zerado encontrado para usuários novos')
      }
      
    } catch (error) {
      console.error('❌ Erro na correção de streaks:', error)
      throw error
    }
  }
  
  /**
   * Executa sincronização completa
   */
  async fullSync(): Promise<void> {
    console.log('🚀 Iniciando sincronização completa de rankings...')
    
    await this.fixZeroStreaksForActiveUsers()
    await this.syncStreakRankings()
    
    console.log('🎉 Sincronização completa finalizada!')
  }
}

export const rankingSyncService = new RankingSyncService()