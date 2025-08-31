import { prisma } from './prisma'

export interface StatsAuditLog {
  userId: string
  action: 'PACK_OPENED' | 'ITEM_OBTAINED' | 'STATS_UPDATED' | 'STATS_CORRECTED' | 'INCONSISTENCY_DETECTED'
  beforeState?: any
  afterState?: any
  metadata?: any
  source: 'MANUAL' | 'AUTOMATIC' | 'SYSTEM' | 'FREE_PACK' | 'REGULAR_PACK' | 'MARKETPLACE'
  success: boolean
  error?: string
  timestamp: Date
}

export class StatsAuditLogger {
  /**
   * Log de uma operação de estatísticas com contexto completo
   */
  async logStatsOperation(log: Omit<StatsAuditLog, 'timestamp'>): Promise<void> {
    try {
      const fullLog: StatsAuditLog = {
        ...log,
        timestamp: new Date()
      }

      // Salvar no banco com estrutura otimizada
      await prisma.$executeRaw`
        INSERT INTO stats_audit_log 
        (user_id, action, before_state, after_state, metadata, source, success, error, timestamp)
        VALUES (
          ${fullLog.userId}, 
          ${fullLog.action}, 
          ${JSON.stringify(fullLog.beforeState)}, 
          ${JSON.stringify(fullLog.afterState)}, 
          ${JSON.stringify(fullLog.metadata)}, 
          ${fullLog.source}, 
          ${fullLog.success}, 
          ${fullLog.error || null}, 
          ${fullLog.timestamp}
        )
      `

      // Log estruturado no console para debugging
      console.log('📊 STATS AUDIT:', {
        userId: fullLog.userId.substring(0, 8) + '...',
        action: fullLog.action,
        source: fullLog.source,
        success: fullLog.success,
        error: fullLog.error,
        metadata: fullLog.metadata
      })

    } catch (error) {
      console.error('Failed to save stats audit log:', error)
      // Não falhar a operação principal por causa do log
    }
  }

  /**
   * Log específico para correção de inconsistências
   */
  async logInconsistencyFix(
    userId: string, 
    inconsistencies: any, 
    success: boolean, 
    error?: string
  ): Promise<void> {
    await this.logStatsOperation({
      userId,
      action: 'STATS_CORRECTED',
      beforeState: inconsistencies.currentStats,
      afterState: inconsistencies.actualData,
      metadata: {
        differences: inconsistencies.difference,
        autoFix: true
      },
      source: 'AUTOMATIC',
      success,
      error
    })
  }

  /**
   * Log de operação de pacote com contexto completo
   */
  async logPackOperation(
    userId: string,
    packId: string,
    itemId: string,
    rarity: string,
    source: StatsAuditLog['source'],
    beforeStats: any,
    afterStats: any,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.logStatsOperation({
      userId,
      action: 'PACK_OPENED',
      beforeState: beforeStats,
      afterState: afterStats,
      metadata: {
        packId,
        itemId,
        rarity,
        statsDiff: {
          packsOpened: (afterStats?.totalPacksOpened || 0) - (beforeStats?.totalPacksOpened || 0),
          itemsCollected: (afterStats?.totalItemsCollected || 0) - (beforeStats?.totalItemsCollected || 0)
        }
      },
      source,
      success,
      error
    })
  }

  /**
   * Obtém histórico de auditoria para um usuário
   */
  async getUserAuditHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const results = await prisma.$queryRaw`
        SELECT * FROM stats_audit_log 
        WHERE user_id = ${userId}
        ORDER BY timestamp DESC 
        LIMIT ${limit}
      `
      return results as any[]
    } catch (error) {
      console.warn('Failed to fetch user audit history:', error)
      return []
    }
  }

  /**
   * Busca operações com falha para investigação
   */
  async getFailedOperations(hours: number = 24, limit: number = 100): Promise<any[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000)
      const results = await prisma.$queryRaw`
        SELECT * FROM stats_audit_log 
        WHERE success = false 
        AND timestamp > ${since}
        ORDER BY timestamp DESC 
        LIMIT ${limit}
      `
      return results as any[]
    } catch (error) {
      console.warn('Failed to fetch failed operations:', error)
      return []
    }
  }

  /**
   * Relatório de integridade das operações
   */
  async getIntegrityReport(hours: number = 24): Promise<{
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    successRate: number
    topErrors: Array<{ error: string, count: number }>
    operationsBySource: Array<{ source: string, count: number, successRate: number }>
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000)

      // Total e taxa de sucesso
      const totals = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_ops,
          COUNT(CASE WHEN success = true THEN 1 END) as successful_ops,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_ops
        FROM stats_audit_log 
        WHERE timestamp > ${since}
      ` as any[]

      const totalOps = Number(totals[0]?.total_ops || 0)
      const successfulOps = Number(totals[0]?.successful_ops || 0)
      const failedOps = Number(totals[0]?.failed_ops || 0)

      // Top erros
      const topErrors = await prisma.$queryRaw`
        SELECT error, COUNT(*) as count
        FROM stats_audit_log 
        WHERE success = false 
        AND error IS NOT NULL
        AND timestamp > ${since}
        GROUP BY error
        ORDER BY count DESC
        LIMIT 10
      ` as any[]

      // Operações por fonte
      const operationsBySource = await prisma.$queryRaw`
        SELECT 
          source,
          COUNT(*) as count,
          COUNT(CASE WHEN success = true THEN 1 END) as successful,
          (COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*)) as success_rate
        FROM stats_audit_log 
        WHERE timestamp > ${since}
        GROUP BY source
        ORDER BY count DESC
      ` as any[]

      return {
        totalOperations: totalOps,
        successfulOperations: successfulOps,
        failedOperations: failedOps,
        successRate: totalOps > 0 ? (successfulOps / totalOps) * 100 : 100,
        topErrors: topErrors.map(e => ({ error: e.error, count: Number(e.count) })),
        operationsBySource: operationsBySource.map(s => ({
          source: s.source,
          count: Number(s.count),
          successRate: Number(s.success_rate)
        }))
      }
    } catch (error) {
      console.warn('Failed to generate integrity report:', error)
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        successRate: 0,
        topErrors: [],
        operationsBySource: []
      }
    }
  }

  /**
   * Inicializar tabela de auditoria se não existir
   */
  async initializeAuditTable(): Promise<void> {
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS stats_audit_log (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          action VARCHAR(50) NOT NULL,
          before_state JSONB,
          after_state JSONB,
          metadata JSONB,
          source VARCHAR(20) NOT NULL,
          success BOOLEAN NOT NULL,
          error TEXT,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `

      // Índices para performance
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_stats_audit_user_timestamp 
        ON stats_audit_log (user_id, timestamp DESC)
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_stats_audit_success_timestamp 
        ON stats_audit_log (success, timestamp DESC)
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_stats_audit_source 
        ON stats_audit_log (source)
      `

      console.log('✅ Stats audit table initialized')
    } catch (error) {
      console.error('Failed to initialize stats audit table:', error)
    }
  }
}

export const statsAuditLogger = new StatsAuditLogger()

// Auto-inicializar tabela na importação
statsAuditLogger.initializeAuditTable().catch(console.error)