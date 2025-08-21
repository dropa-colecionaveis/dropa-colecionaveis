import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import { AdminUser } from './admin-auth'

export interface AuditLogData {
  action: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  description: string
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user: {
    email: string
    name: string | null
    role: string
  }
}

/**
 * Cria um log de auditoria para ações administrativas
 */
export async function createAuditLog(
  userId: string,
  data: AuditLogData,
  req?: NextRequest
): Promise<void> {
  try {
    // Extrair informações da requisição se disponível
    const ipAddress = req ? getClientIP(req) : undefined
    const userAgent = req ? req.headers.get('user-agent') : undefined

    await prisma.adminLog.create({
      data: {
        userId,
        action: data.action,
        description: data.description,
        metadata: data.metadata || {},
        ipAddress: ipAddress || data.ipAddress,
        userAgent: userAgent || data.userAgent
      }
    })

    console.log(`📋 Audit log created: ${data.action} by user ${userId}`)
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Não falhar a operação principal se o log falhar
  }
}

/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(options: {
  page?: number
  limit?: number
  userId?: string
  action?: string
  startDate?: Date
  endDate?: Date
}): Promise<{
  logs: AuditLogEntry[]
  total: number
  totalPages: number
}> {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    startDate,
    endDate
  } = options

  const where = {
    ...(userId && { userId }),
    ...(action && { action: { contains: action } }),
    ...(startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate })
      }
    }
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.adminLog.count({ where })
  ])

  return {
    logs: logs as AuditLogEntry[],
    total,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Ações pré-definidas para logs de auditoria
 */
export const AUDIT_ACTIONS = {
  // Autenticação
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGOUT: 'admin_logout',
  ADMIN_LOGIN_FAILED: 'admin_login_failed',

  // Gestão de usuários
  USER_VIEW: 'user_view',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',
  USER_BAN: 'user_ban',
  USER_UNBAN: 'user_unban',
  USER_ADD_CREDITS: 'user_add_credits',
  USER_REMOVE_CREDITS: 'user_remove_credits',

  // Gestão de itens
  ITEM_CREATE: 'item_create',
  ITEM_EDIT: 'item_edit',
  ITEM_DELETE: 'item_delete',
  ITEM_ACTIVATE: 'item_activate',
  ITEM_DEACTIVATE: 'item_deactivate',

  // Gestão de pacotes
  PACK_CREATE: 'pack_create',
  PACK_EDIT: 'pack_edit',
  PACK_DELETE: 'pack_delete',
  PACK_PROBABILITY_UPDATE: 'pack_probability_update',

  // Gestão de coleções
  COLLECTION_CREATE: 'collection_create',
  COLLECTION_EDIT: 'collection_edit',
  COLLECTION_DELETE: 'collection_delete',

  // Marketplace
  MARKETPLACE_LISTING_REMOVE: 'marketplace_listing_remove',
  MARKETPLACE_TRANSACTION_REFUND: 'marketplace_transaction_refund',
  MARKETPLACE_RULE_UPDATE: 'marketplace_rule_update',

  // Sistema
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore',
  SYSTEM_STATS_VIEW: 'system_stats_view',
  SYSTEM_SETTINGS_UPDATE: 'system_settings_update',

  // Conquistas
  ACHIEVEMENT_CREATE: 'achievement_create',
  ACHIEVEMENT_EDIT: 'achievement_edit',
  ACHIEVEMENT_DELETE: 'achievement_delete',

  // Anti-fraude
  FRAUD_DETECTION_VIEW: 'fraud_detection_view',
  FRAUD_USER_FLAG: 'fraud_user_flag',
  FRAUD_USER_UNFLAG: 'fraud_user_unflag'
} as const

/**
 * Helper para criar logs específicos de ações comuns
 */
export class AuditLogger {
  constructor(private user: AdminUser, private req?: NextRequest) {}

  async logUserAction(action: string, targetUserId: string, description: string, metadata?: any) {
    await createAuditLog(
      this.user.id,
      {
        action,
        description,
        metadata: {
          targetUserId,
          ...metadata
        }
      },
      this.req
    )
  }

  async logItemAction(action: string, itemId: string, description: string, metadata?: any) {
    await createAuditLog(
      this.user.id,
      {
        action,
        description,
        metadata: {
          itemId,
          ...metadata
        }
      },
      this.req
    )
  }

  async logSystemAction(action: string, description: string, metadata?: any) {
    await createAuditLog(
      this.user.id,
      {
        action,
        description,
        metadata
      },
      this.req
    )
  }
}

/**
 * Extrai o IP do cliente da requisição
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const remoteAddr = req.headers.get('remote-addr')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (remoteAddr) {
    return remoteAddr
  }

  return 'unknown'
}

/**
 * Obter estatísticas de auditoria
 */
export async function getAuditStats(days: number = 30): Promise<{
  totalActions: number
  uniqueUsers: number
  topActions: Array<{ action: string; count: number }>
  activityByDay: Array<{ date: string; count: number }>
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [totalActions, uniqueUsers, topActions, activityByDay] = await Promise.all([
    // Total de ações
    prisma.adminLog.count({
      where: {
        createdAt: { gte: startDate }
      }
    }),

    // Usuários únicos
    prisma.adminLog.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: { userId: true },
      distinct: ['userId']
    }).then(users => users.length),

    // Top ações
    prisma.adminLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      },
      take: 10
    }).then(results =>
      results.map(r => ({
        action: r.action,
        count: r._count.action
      }))
    ),

    // Atividade por dia
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM admin_logs 
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    ` as Array<{ date: string; count: number }>
  ])

  return {
    totalActions,
    uniqueUsers,
    topActions,
    activityByDay
  }
}