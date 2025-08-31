import { prisma } from './prisma'
import { statsValidator } from './stats-validator'

export interface MonitoringResult {
  timestamp: Date
  inconsistenciesFound: number
  autoFixedUsers: number
  criticalErrors: number
  healthStatus: 'healthy' | 'warning' | 'critical'
}

export class StatsMonitor {
  private isRunning = false
  private monitoringInterval: NodeJS.Timeout | null = null

  /**
   * Inicia o monitoramento automático das estatísticas
   * Executa a cada 30 minutos por padrão
   */
  startMonitoring(intervalMinutes: number = 30): void {
    if (this.isRunning) {
      console.log('⚠️ Stats monitoring already running')
      return
    }

    console.log(`🔍 Starting automatic stats monitoring (every ${intervalMinutes} minutes)`)
    
    this.isRunning = true
    this.monitoringInterval = setInterval(
      () => this.runMonitoringCycle(),
      intervalMinutes * 60 * 1000
    )

    // Executar imediatamente na inicialização
    this.runMonitoringCycle()
  }

  /**
   * Para o monitoramento automático
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isRunning = false
    console.log('⏹️ Stats monitoring stopped')
  }

  /**
   * Executa um ciclo completo de monitoramento
   */
  async runMonitoringCycle(): Promise<MonitoringResult> {
    const startTime = new Date()
    console.log('🔍 Starting stats monitoring cycle...')

    try {
      // 1. Detectar inconsistências
      const inconsistencies = await statsValidator.findInconsistencies()
      
      // 2. Auto-corrigir inconsistências menores (até 5 usuários por vez)
      const criticalThreshold = 5
      let autoFixedUsers = 0
      let criticalErrors = 0

      if (inconsistencies.length > 0 && inconsistencies.length <= criticalThreshold) {
        console.log(`🔧 Auto-fixing ${inconsistencies.length} minor inconsistencies...`)
        
        for (const inconsistency of inconsistencies) {
          try {
            const success = await statsValidator.fixUserStats(inconsistency.userId)
            if (success) {
              autoFixedUsers++
            } else {
              criticalErrors++
            }
          } catch (error) {
            console.error(`❌ Failed to auto-fix user ${inconsistency.userId}:`, error)
            criticalErrors++
          }
        }
      } else if (inconsistencies.length > criticalThreshold) {
        console.warn(`⚠️ Too many inconsistencies (${inconsistencies.length}) - manual intervention required`)
        criticalErrors = inconsistencies.length
      }

      // 3. Determinar status de saúde
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
      
      if (criticalErrors > 0) {
        healthStatus = 'critical'
      } else if (inconsistencies.length > 0) {
        healthStatus = 'warning'
      }

      // 4. Log do resultado
      const result: MonitoringResult = {
        timestamp: startTime,
        inconsistenciesFound: inconsistencies.length,
        autoFixedUsers,
        criticalErrors,
        healthStatus
      }

      // 5. Salvar resultado no banco (opcional)
      await this.saveMonitoringResult(result)

      // 6. Log estruturado
      const duration = Date.now() - startTime.getTime()
      console.log(`✅ Monitoring cycle completed in ${duration}ms:`, {
        inconsistencies: inconsistencies.length,
        autoFixed: autoFixedUsers,
        errors: criticalErrors,
        status: healthStatus
      })

      // 7. Alertas se necessário
      if (healthStatus === 'critical') {
        await this.sendCriticalAlert(result)
      }

      return result

    } catch (error) {
      console.error('❌ Critical error in monitoring cycle:', error)
      
      const errorResult: MonitoringResult = {
        timestamp: startTime,
        inconsistenciesFound: 0,
        autoFixedUsers: 0,
        criticalErrors: 1,
        healthStatus: 'critical'
      }

      await this.sendCriticalAlert(errorResult, error)
      return errorResult
    }
  }

  /**
   * Salva resultado do monitoramento no banco
   */
  private async saveMonitoringResult(result: MonitoringResult): Promise<void> {
    try {
      // Criar tabela de monitoramento se não existir
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS stats_monitoring_log (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL,
          inconsistencies_found INTEGER NOT NULL,
          auto_fixed_users INTEGER NOT NULL,
          critical_errors INTEGER NOT NULL,
          health_status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `

      // Inserir resultado
      await prisma.$executeRaw`
        INSERT INTO stats_monitoring_log 
        (timestamp, inconsistencies_found, auto_fixed_users, critical_errors, health_status)
        VALUES (${result.timestamp}, ${result.inconsistenciesFound}, ${result.autoFixedUsers}, ${result.criticalErrors}, ${result.healthStatus})
      `
    } catch (error) {
      console.warn('Failed to save monitoring result:', error)
    }
  }

  /**
   * Envia alerta crítico (pode ser integrado com sistemas de notificação)
   */
  private async sendCriticalAlert(result: MonitoringResult, error?: any): Promise<void> {
    const alertData = {
      timestamp: result.timestamp.toISOString(),
      message: 'Critical stats inconsistencies detected',
      details: {
        inconsistencies: result.inconsistenciesFound,
        errors: result.criticalErrors,
        error: error?.message
      }
    }

    // Log do alerta
    console.error('🚨 CRITICAL ALERT:', alertData)

    // Aqui você pode integrar com:
    // - Sistemas de email
    // - Slack/Discord webhooks
    // - Sistemas de monitoramento (DataDog, New Relic, etc)
    // - Push notifications

    try {
      // Exemplo: Salvar no banco como log administrativo
      await prisma.adminLog.create({
        data: {
          action: 'STATS_CRITICAL_ALERT',
          details: alertData,
          userId: 'system', // Ou ID do admin principal
          success: false
        }
      })
    } catch (logError) {
      console.error('Failed to save critical alert:', logError)
    }
  }

  /**
   * Obtém histórico de monitoramento
   */
  async getMonitoringHistory(limit: number = 50): Promise<any[]> {
    try {
      const results = await prisma.$queryRaw`
        SELECT * FROM stats_monitoring_log 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `
      return results as any[]
    } catch (error) {
      console.warn('Failed to fetch monitoring history:', error)
      return []
    }
  }

  /**
   * Obtém status atual da saúde do sistema
   */
  async getCurrentHealthStatus(): Promise<MonitoringResult | null> {
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM stats_monitoring_log 
        ORDER BY created_at DESC 
        LIMIT 1
      ` as any[]

      if (result.length === 0) return null

      const latest = result[0]
      return {
        timestamp: new Date(latest.timestamp),
        inconsistenciesFound: latest.inconsistencies_found,
        autoFixedUsers: latest.auto_fixed_users,
        criticalErrors: latest.critical_errors,
        healthStatus: latest.health_status
      }
    } catch (error) {
      console.warn('Failed to get current health status:', error)
      return null
    }
  }
}

export const statsMonitor = new StatsMonitor()