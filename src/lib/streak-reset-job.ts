import { prisma } from './prisma'

export class StreakResetService {
  // Resetar streaks de usuários que não fizeram login ontem (dia de calendário completo no Brasil)
  async resetInactiveUserStreaks(): Promise<void> {
    console.log('🔄 Starting streak reset job...')
    
    try {
      const now = new Date()
      
      // Calcular "ontem" no horário de Brasília (dia de calendário completo)
      const nowBrasil = new Date(now.toLocaleString('en-US', {
        timeZone: 'America/Sao_Paulo'
      }))
      
      const yesterdayBrasil = new Date(nowBrasil)
      yesterdayBrasil.setDate(yesterdayBrasil.getDate() - 1)
      
      // Início e fim do dia de ontem no Brasil
      const yesterdayStart = new Date(yesterdayBrasil.getFullYear(), yesterdayBrasil.getMonth(), yesterdayBrasil.getDate(), 0, 0, 0)
      const yesterdayEnd = new Date(yesterdayBrasil.getFullYear(), yesterdayBrasil.getMonth(), yesterdayBrasil.getDate(), 23, 59, 59, 999)
      
      // Converter para UTC para comparação no banco
      const yesterdayStartUTC = new Date(yesterdayStart.getTime() + (3 * 60 * 60 * 1000)) // Brasil = UTC-3, então +3h para UTC
      const yesterdayEndUTC = new Date(yesterdayEnd.getTime() + (3 * 60 * 60 * 1000))
      
      console.log('🇧🇷 Current date (Brasil):', nowBrasil.toLocaleDateString('pt-BR'))
      console.log('📅 Yesterday (Brasil):', yesterdayBrasil.toLocaleDateString('pt-BR'))
      console.log('⏰ Yesterday range (Brasil):', 
        `${yesterdayStart.toLocaleString('pt-BR')} - ${yesterdayEnd.toLocaleString('pt-BR')}`)
      
      // Buscar usuários com streak > 0 que NÃO tiveram atividade durante o dia de ontem
      const inactiveUsers = await prisma.userStats.findMany({
        where: {
          currentStreak: { gt: 0 },
          OR: [
            // Não teve atividade ontem
            { 
              lastActivityAt: { 
                not: {
                  gte: yesterdayStartUTC,
                  lte: yesterdayEndUTC
                }
              }
            },
            // Nunca teve atividade
            { lastActivityAt: null }
          ],
          user: {
            role: {
              notIn: ['ADMIN', 'SUPER_ADMIN']
            }
          }
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      })
      
      console.log(`📊 Found ${inactiveUsers.length} users with broken streaks`)
      
      if (inactiveUsers.length > 0) {
        // Resetar currentStreak para 0 em batch
        const userIds = inactiveUsers.map(u => u.userId)
        
        const updateResult = await prisma.userStats.updateMany({
          where: {
            userId: { in: userIds }
          },
          data: {
            currentStreak: 0
          }
        })
        
        console.log(`✅ Reset ${updateResult.count} user streaks to 0`)
        
        // Log dos usuários afetados (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          inactiveUsers.forEach(user => {
            const lastActivity = user.lastActivityAt 
              ? user.lastActivityAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
              : 'Never'
            
            console.log(`  ↳ ${user.user.email}: streak ${user.currentStreak} → 0 (last activity: ${lastActivity})`)
          })
        }
        
        // Invalidar cache de rankings pois os streaks mudaram
        await this.invalidateRankingsCache()
      }
      
      console.log('✅ Streak reset job completed successfully')
      
    } catch (error) {
      console.error('❌ Error in streak reset job:', error)
      throw error
    }
  }
  
  private async invalidateRankingsCache(): Promise<void> {
    try {
      // Invalidar cache das categorias que dependem de streak
      const { revalidateTag } = await import('next/cache')
      revalidateTag('rankings-WEEKLY_ACTIVE')
      revalidateTag('rankings-MONTHLY_ACTIVE')
      console.log('🗄️ Rankings cache invalidated')
    } catch (error) {
      console.log('⚠️ Could not invalidate cache:', error.message)
    }
  }
  
  // Método para testar o job manualmente
  async testStreakReset(): Promise<void> {
    console.log('🧪 Testing streak reset logic...')
    await this.resetInactiveUserStreaks()
  }
}

// Instância singleton
export const streakResetService = new StreakResetService()