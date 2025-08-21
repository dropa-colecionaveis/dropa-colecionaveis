import { rankingScheduler } from './ranking-scheduler'
import { achievementEngine } from './achievements'

export class AppInitializer {
  private static initialized = false

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    console.log('🚀 Initializing Digital Collectibles Platform...')

    try {
      // 1. Inicializar achievements no banco
      console.log('📊 Initializing achievements...')
      await achievementEngine.initializeAchievements()

      // 2. Iniciar scheduler de rankings se em produção
      if (process.env.NODE_ENV === 'production') {
        console.log('🏆 Starting ranking scheduler...')
        rankingScheduler.start()
        
        // Atualização diária às 2:00 AM
        rankingScheduler.scheduleDaily(2, 0)
      } else {
        console.log('🔧 Development mode: Ranking scheduler manual')
      }

      // 3. Atualizar rankings uma vez na inicialização
      console.log('📈 Updating rankings on startup...')
      setTimeout(() => {
        rankingScheduler.updateRankings().catch(error => {
          console.error('Error updating rankings on startup:', error)
        })
      }, 5000) // 5 segundos de delay para dar tempo do banco inicializar

      this.initialized = true
      console.log('✅ Platform initialized successfully!')

    } catch (error) {
      console.error('❌ Error initializing platform:', error)
      throw error
    }
  }

  static async shutdown(): Promise<void> {
    console.log('🔄 Shutting down platform services...')
    
    rankingScheduler.stop()
    
    console.log('✅ Platform shutdown complete')
  }

  static isInitialized(): boolean {
    return this.initialized
  }

  // Método para forçar re-inicialização (útil para testes)
  static reset(): void {
    this.initialized = false
  }
}

// Auto-inicializar apenas em environment de servidor Node.js
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
  // Aguardar um pouco para garantir que tudo está inicializado
  setTimeout(() => {
    AppInitializer.initialize().catch(error => {
      console.error('Failed to auto-initialize platform:', error)
    })
  }, 2000)
}

export default AppInitializer