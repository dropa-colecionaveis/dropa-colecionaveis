import { rankingService } from './rankings'

export class RankingScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private readonly UPDATE_INTERVAL = 60 * 60 * 1000 // 1 hora

  // Iniciar o scheduler automático
  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Ranking scheduler already running')
      return
    }

    console.log('🚀 Starting ranking scheduler (updates every hour)')
    
    // Atualizar imediatamente
    this.updateRankings()
    
    // Agendar atualizações periódicas
    this.intervalId = setInterval(() => {
      this.updateRankings()
    }, this.UPDATE_INTERVAL)
  }

  // Parar o scheduler
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('⏹️ Ranking scheduler stopped')
    }
  }

  // Atualizar rankings manualmente
  async updateRankings(): Promise<void> {
    try {
      console.log('🏆 Updating rankings...')
      await rankingService.updateRankingsJob()
    } catch (error) {
      console.error('❌ Error in ranking update job:', error)
    }
  }

  // Verificar se está rodando
  isRunning(): boolean {
    return this.intervalId !== null
  }

  // Agendar atualização com delay personalizado
  scheduleUpdate(delayMs: number = 0): void {
    setTimeout(() => {
      this.updateRankings()
    }, delayMs)
  }

  // Configurar horários específicos para atualização (ex: meia-noite)
  scheduleDaily(hour: number = 0, minute: number = 0): void {
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hour, minute, 0, 0)

    // Se já passou do horário hoje, agendar para amanhã
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilScheduled = scheduledTime.getTime() - now.getTime()

    console.log(`⏰ Daily ranking update scheduled for ${scheduledTime.toLocaleString()}`)

    setTimeout(() => {
      this.updateRankings()
      
      // Agendar próxima atualização (24h depois)
      this.scheduleDaily(hour, minute)
    }, timeUntilScheduled)
  }
}

export const rankingScheduler = new RankingScheduler()

// Auto-start em produção
if (process.env.NODE_ENV === 'production') {
  rankingScheduler.start()
  
  // Atualização diária às 2:00 AM
  rankingScheduler.scheduleDaily(2, 0)
}