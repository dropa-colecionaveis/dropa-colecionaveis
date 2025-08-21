import { prisma } from '@/lib/prisma'

export type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_VERIFICATION'
  | 'PAYMENT_ATTEMPT'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_ACCESS'
  | 'DATA_EXPORT'
  | 'DATA_DELETION_REQUEST'
  | 'ADMIN_ACTION'
  | 'API_ERROR'
  | 'UNAUTHORIZED_ACCESS'

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SecurityEvent {
  type: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  endpoint?: string
  method?: string
  description: string
  metadata?: Record<string, any>
  timestamp?: Date
}

export interface SecurityLogEntry {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  userId: string | null
  userEmail: string | null
  ipAddress: string | null
  userAgent: string | null
  endpoint: string | null
  method: string | null
  description: string
  metadata: any
  createdAt: Date
}

class SecurityLogger {
  private logQueue: SecurityEvent[] = []
  private isProcessing = false

  // Log security event
  async log(event: SecurityEvent): Promise<void> {
    try {
      // Add to queue for batch processing
      this.logQueue.push({
        ...event,
        timestamp: new Date()
      })

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue()
      }

      // Console log for immediate visibility
      this.logToConsole(event)

      // Handle critical events immediately
      if (event.severity === 'CRITICAL') {
        await this.handleCriticalEvent(event)
      }

    } catch (error) {
      console.error('❌ Security logging failed:', error)
    }
  }

  // Process log queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      const events = [...this.logQueue]
      this.logQueue = []

      // Save to database in batch
      await this.saveToDB(events)

    } catch (error) {
      console.error('❌ Failed to process security log queue:', error)
      
      // Re-add events to queue for retry
      this.logQueue.unshift(...this.logQueue)
      
    } finally {
      this.isProcessing = false
      
      // Process remaining queue if any
      if (this.logQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000)
      }
    }
  }

  // Save events to database
  private async saveToDB(events: SecurityEvent[]): Promise<void> {
    try {
      // For now, we'll extend the AdminLog model to store security events
      const logEntries = events.map(event => ({
        userId: event.userId || 'system',
        action: `SECURITY_${event.type}`,
        description: event.description,
        metadata: {
          severity: event.severity,
          type: event.type,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          endpoint: event.endpoint,
          method: event.method,
          timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
          ...event.metadata
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      }))

      // Save in batches of 100
      for (let i = 0; i < logEntries.length; i += 100) {
        const batch = logEntries.slice(i, i + 100)
        await prisma.adminLog.createMany({
          data: batch
        })
      }

    } catch (error) {
      console.error('❌ Failed to save security logs to database:', error)
      throw error
    }
  }

  // Console logging with formatting
  private logToConsole(event: SecurityEvent): void {
    const severityEmojis = {
      LOW: '🟢',
      MEDIUM: '🟡',
      HIGH: '🟠',
      CRITICAL: '🔴'
    }

    const emoji = severityEmojis[event.severity]
    const timestamp = new Date().toISOString()
    const user = event.userEmail || event.userId || 'anonymous'
    const ip = event.ipAddress || 'unknown'

    console.log(`${emoji} [SECURITY] ${timestamp} ${event.type} - ${event.description}`)
    console.log(`   User: ${user} | IP: ${ip} | Severity: ${event.severity}`)
    
    if (event.metadata) {
      console.log(`   Metadata:`, event.metadata)
    }
  }

  // Handle critical security events
  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      console.error(`🚨 CRITICAL SECURITY EVENT: ${event.type}`)
      console.error(`Description: ${event.description}`)
      console.error(`User: ${event.userEmail || event.userId || 'unknown'}`)
      console.error(`IP: ${event.ipAddress || 'unknown'}`)
      
      // In production, you would:
      // 1. Send immediate alerts (email, Slack, etc.)
      // 2. Block suspicious IPs
      // 3. Notify security team
      // 4. Trigger automated responses

      // For now, just force immediate database save
      await this.saveToDB([event])

    } catch (error) {
      console.error('❌ Failed to handle critical security event:', error)
    }
  }

  // Convenience methods for common events
  async logLogin(success: boolean, userId?: string, userEmail?: string, ipAddress?: string, userAgent?: string, reason?: string): Promise<void> {
    await this.log({
      type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      severity: success ? 'LOW' : 'MEDIUM',
      userId,
      userEmail,
      ipAddress,
      userAgent,
      description: success 
        ? `User logged in successfully`
        : `Failed login attempt: ${reason || 'Invalid credentials'}`,
      metadata: success ? undefined : { failureReason: reason }
    })
  }

  async logPayment(success: boolean, userId: string, amount: number, method: string, ipAddress?: string, details?: any): Promise<void> {
    await this.log({
      type: success ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
      severity: success ? 'LOW' : 'MEDIUM',
      userId,
      ipAddress,
      description: success 
        ? `Payment processed successfully: R$ ${amount} via ${method}`
        : `Payment failed: R$ ${amount} via ${method}`,
      metadata: {
        amount,
        method,
        ...details
      }
    })
  }

  async logRateLimit(ipAddress: string, endpoint: string, userAgent?: string): Promise<void> {
    await this.log({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'HIGH',
      ipAddress,
      userAgent,
      endpoint,
      description: `Rate limit exceeded for endpoint: ${endpoint}`,
      metadata: {
        endpoint,
        blockedAt: new Date().toISOString()
      }
    })
  }

  async logSuspiciousActivity(description: string, userId?: string, ipAddress?: string, severity: SecuritySeverity = 'HIGH', metadata?: any): Promise<void> {
    await this.log({
      type: 'SUSPICIOUS_ACTIVITY',
      severity,
      userId,
      ipAddress,
      description,
      metadata
    })
  }

  async logDataAccess(type: 'EXPORT' | 'DELETION_REQUEST', userId: string, description: string, ipAddress?: string): Promise<void> {
    await this.log({
      type: type === 'EXPORT' ? 'DATA_EXPORT' : 'DATA_DELETION_REQUEST',
      severity: 'MEDIUM',
      userId,
      ipAddress,
      description,
      metadata: {
        dataType: type,
        requestedAt: new Date().toISOString()
      }
    })
  }

  async logUnauthorizedAccess(endpoint: string, ipAddress?: string, userAgent?: string, userId?: string): Promise<void> {
    await this.log({
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      userId,
      ipAddress,
      userAgent,
      endpoint,
      description: `Unauthorized access attempt to: ${endpoint}`,
      metadata: {
        endpoint,
        attemptedAt: new Date().toISOString()
      }
    })
  }

  // Get security statistics
  async getSecurityStats(hours: number = 24): Promise<any> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000)

      const logs = await prisma.adminLog.findMany({
        where: {
          action: {
            startsWith: 'SECURITY_'
          },
          createdAt: {
            gte: since
          }
        },
        select: {
          action: true,
          metadata: true,
          createdAt: true,
          ipAddress: true
        }
      })

      // Analyze logs
      const stats = {
        totalEvents: logs.length,
        eventsByType: {} as Record<string, number>,
        eventsBySeverity: {} as Record<string, number>,
        topIPs: {} as Record<string, number>,
        recentCritical: logs.filter(log => 
          log.metadata && (log.metadata as any).severity === 'CRITICAL'
        ).length,
        timeRange: `${hours} hours`,
        generatedAt: new Date().toISOString()
      }

      // Count by type and severity
      for (const log of logs) {
        const type = log.action.replace('SECURITY_', '')
        const severity = (log.metadata as any)?.severity || 'UNKNOWN'
        const ip = log.ipAddress || 'unknown'

        stats.eventsByType[type] = (stats.eventsByType[type] || 0) + 1
        stats.eventsBySeverity[severity] = (stats.eventsBySeverity[severity] || 0) + 1
        stats.topIPs[ip] = (stats.topIPs[ip] || 0) + 1
      }

      return stats

    } catch (error) {
      console.error('❌ Failed to get security stats:', error)
      return null
    }
  }

  // Clean up old logs
  async cleanupOldLogs(days: number = 90): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const result = await prisma.adminLog.deleteMany({
        where: {
          action: {
            startsWith: 'SECURITY_'
          },
          createdAt: {
            lt: cutoff
          }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} old security logs (older than ${days} days)`)
      return result.count

    } catch (error) {
      console.error('❌ Failed to cleanup old security logs:', error)
      return 0
    }
  }

  // Search security logs
  async searchLogs(
    filters: {
      type?: SecurityEventType
      severity?: SecuritySeverity
      userId?: string
      ipAddress?: string
      startDate?: Date
      endDate?: Date
    },
    limit: number = 100
  ): Promise<SecurityLogEntry[]> {
    try {
      const where: any = {
        action: {
          startsWith: 'SECURITY_'
        }
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = filters.startDate
        if (filters.endDate) where.createdAt.lte = filters.endDate
      }

      if (filters.userId) {
        where.userId = filters.userId
      }

      if (filters.ipAddress) {
        where.ipAddress = filters.ipAddress
      }

      const logs = await prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: { email: true }
          }
        }
      })

      return logs.map(log => ({
        id: log.id,
        type: log.action.replace('SECURITY_', '') as SecurityEventType,
        severity: (log.metadata as any)?.severity || 'UNKNOWN',
        userId: log.userId === 'system' ? null : log.userId,
        userEmail: log.user?.email || null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        endpoint: (log.metadata as any)?.endpoint || null,
        method: (log.metadata as any)?.method || null,
        description: log.description,
        metadata: log.metadata,
        createdAt: log.createdAt
      }))

    } catch (error) {
      console.error('❌ Failed to search security logs:', error)
      return []
    }
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger()