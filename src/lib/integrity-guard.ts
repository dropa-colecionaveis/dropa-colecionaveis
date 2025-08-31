import { prisma } from './prisma'
import { statsValidator } from './stats-validator'
import { statsAuditLogger } from './stats-audit-logger'

export interface IntegrityCheckResult {
  isValid: boolean
  inconsistencies: any[]
  autoFixed: boolean
  errors: string[]
  metadata?: any
}

export class IntegrityGuard {
  /**
   * Middleware para verificar integridade antes/depois de operações críticas
   */
  async wrapOperation<T>(
    userId: string,
    operation: () => Promise<T>,
    operationName: string,
    source: 'MANUAL' | 'AUTOMATIC' | 'SYSTEM' | 'FREE_PACK' | 'REGULAR_PACK' | 'MARKETPLACE'
  ): Promise<{ result: T; integrity: IntegrityCheckResult }> {
    
    // 1. Capturar estado anterior
    const beforeStats = await this.captureUserStats(userId)
    let result: T
    let operationSuccess = true
    let operationError: string | undefined

    try {
      // 2. Executar operação
      console.log(`🔒 IntegrityGuard: Starting ${operationName} for user ${userId.substring(0, 8)}...`)
      result = await operation()
      
    } catch (error) {
      operationSuccess = false
      operationError = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ IntegrityGuard: ${operationName} failed:`, error)
      throw error
    }

    // 3. Capturar estado posterior
    const afterStats = await this.captureUserStats(userId)

    // 4. Verificar integridade
    const integrityResult = await this.checkPostOperationIntegrity(
      userId,
      beforeStats,
      afterStats,
      operationName
    )

    // 5. Log completo da operação
    await statsAuditLogger.logStatsOperation({
      userId,
      action: this.mapOperationToAction(operationName),
      beforeState: beforeStats,
      afterState: afterStats,
      metadata: {
        operationName,
        integrity: integrityResult,
        duration: Date.now() - Date.now() // Placeholder - você pode implementar timing real
      },
      source,
      success: operationSuccess && integrityResult.isValid,
      error: operationError
    })

    console.log(`✅ IntegrityGuard: ${operationName} completed. Integrity: ${integrityResult.isValid ? 'VALID' : 'ISSUES_FOUND'}`)

    return { result, integrity: integrityResult }
  }

  /**
   * Verifica integridade pós-operação e tenta corrigir automaticamente
   */
  private async checkPostOperationIntegrity(
    userId: string,
    beforeStats: any,
    afterStats: any,
    operationName: string
  ): Promise<IntegrityCheckResult> {
    
    try {
      // 1. Verificar inconsistências gerais
      const inconsistencies = await statsValidator.findInconsistencies()
      const userInconsistency = inconsistencies.find(inc => inc.userId === userId)

      if (!userInconsistency) {
        return {
          isValid: true,
          inconsistencies: [],
          autoFixed: false,
          errors: []
        }
      }

      // 2. Tentar correção automática
      console.log(`⚠️ IntegrityGuard: Inconsistency detected for user ${userId} after ${operationName}, attempting auto-fix...`)
      
      const fixSuccess = await statsValidator.fixUserStats(userId)
      
      if (fixSuccess) {
        // Log da correção
        await statsAuditLogger.logInconsistencyFix(userId, userInconsistency, true)
        
        return {
          isValid: true,
          inconsistencies: [userInconsistency],
          autoFixed: true,
          errors: [],
          metadata: {
            originalInconsistency: userInconsistency,
            correctionApplied: true
          }
        }
      } else {
        // Correção falhou
        await statsAuditLogger.logInconsistencyFix(userId, userInconsistency, false, 'Auto-fix failed')
        
        return {
          isValid: false,
          inconsistencies: [userInconsistency],
          autoFixed: false,
          errors: [`Failed to auto-fix inconsistencies for user ${userId}`],
          metadata: {
            originalInconsistency: userInconsistency,
            correctionAttempted: true,
            correctionFailed: true
          }
        }
      }

    } catch (error) {
      console.error('IntegrityGuard: Error during integrity check:', error)
      return {
        isValid: false,
        inconsistencies: [],
        autoFixed: false,
        errors: [error instanceof Error ? error.message : 'Unknown integrity check error']
      }
    }
  }

  /**
   * Captura snapshot das estatísticas do usuário
   */
  private async captureUserStats(userId: string): Promise<any> {
    try {
      const [userStats, itemCount, packCount] = await Promise.all([
        prisma.userStats.findUnique({ where: { userId } }),
        prisma.userItem.count({ where: { userId } }),
        prisma.packOpening.count({ where: { userId } })
      ])

      return {
        userStats,
        actualItemCount: itemCount,
        actualPackCount: packCount,
        capturedAt: new Date()
      }
    } catch (error) {
      console.error('Failed to capture user stats:', error)
      return {
        userStats: null,
        actualItemCount: 0,
        actualPackCount: 0,
        capturedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mapeia nome da operação para action do audit log
   */
  private mapOperationToAction(operationName: string): any {
    const mappings: Record<string, any> = {
      'free-pack-claim': 'PACK_OPENED',
      'regular-pack-open': 'PACK_OPENED',
      'marketplace-purchase': 'ITEM_OBTAINED',
      'stats-update': 'STATS_UPDATED'
    }
    return mappings[operationName] || 'STATS_UPDATED'
  }

  /**
   * Wrapper específico para operações de pacotes
   */
  async wrapPackOperation<T>(
    userId: string,
    operation: () => Promise<T>,
    packId: string,
    source: 'FREE_PACK' | 'REGULAR_PACK'
  ): Promise<{ result: T; integrity: IntegrityCheckResult }> {
    
    const operationName = source === 'FREE_PACK' ? 'free-pack-claim' : 'regular-pack-open'
    
    return this.wrapOperation(
      userId,
      operation,
      operationName,
      source
    )
  }

  /**
   * Wrapper específico para operações de marketplace
   */
  async wrapMarketplaceOperation<T>(
    userId: string,
    operation: () => Promise<T>,
    listingId: string
  ): Promise<{ result: T; integrity: IntegrityCheckResult }> {
    
    return this.wrapOperation(
      userId,
      operation,
      'marketplace-purchase',
      'MARKETPLACE'
    )
  }

  /**
   * Verificação de integridade manual (para uso em endpoints administrativos)
   */
  async performManualIntegrityCheck(userId?: string): Promise<{
    usersChecked: number
    inconsistenciesFound: number
    autoFixedUsers: number
    errors: string[]
  }> {
    
    console.log('🔍 Performing manual integrity check...')
    
    try {
      if (userId) {
        // Verificar usuário específico
        const inconsistencies = await statsValidator.findInconsistencies()
        const userInconsistency = inconsistencies.find(inc => inc.userId === userId)
        
        if (userInconsistency) {
          const fixSuccess = await statsValidator.fixUserStats(userId)
          return {
            usersChecked: 1,
            inconsistenciesFound: 1,
            autoFixedUsers: fixSuccess ? 1 : 0,
            errors: fixSuccess ? [] : ['Failed to fix user inconsistencies']
          }
        } else {
          return {
            usersChecked: 1,
            inconsistenciesFound: 0,
            autoFixedUsers: 0,
            errors: []
          }
        }
      } else {
        // Verificar todos os usuários
        const result = await statsValidator.fixAllInconsistencies()
        return {
          usersChecked: result.fixed + result.failed,
          inconsistenciesFound: result.fixed + result.failed,
          autoFixedUsers: result.fixed,
          errors: result.failed > 0 ? [`${result.failed} users failed to fix`] : []
        }
      }
    } catch (error) {
      console.error('Manual integrity check failed:', error)
      return {
        usersChecked: 0,
        inconsistenciesFound: 0,
        autoFixedUsers: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

export const integrityGuard = new IntegrityGuard()