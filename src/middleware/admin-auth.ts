import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, requirePermission } from '@/lib/admin-auth'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log'

/**
 * Middleware para verificar autenticação de admin
 */
export async function adminAuthMiddleware(req: NextRequest) {
  const authResult = await verifyAdminAuth(req)
  
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 401 }
    )
  }

  return authResult
}

/**
 * Middleware para verificar permissões específicas
 */
export async function adminPermissionMiddleware(
  req: NextRequest,
  requiredRole: 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'
) {
  const authResult = await requirePermission(req, requiredRole)
  
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  return authResult
}

/**
 * Wrapper para APIs admin que require autenticação
 */
export function withAdminAuth<T extends any[]>(
  handler: (req: NextRequest, authResult: any, ...args: T) => Promise<NextResponse>,
  requiredRole: 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await adminPermissionMiddleware(req, requiredRole)
      
      if (authResult instanceof NextResponse) {
        return authResult // Erro de autenticação
      }

      return await handler(req, authResult, ...args)
    } catch (error) {
      console.error('Admin API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wrapper para APIs admin com log de auditoria automático
 */
export function withAdminAuthAndAudit<T extends any[]>(
  handler: (req: NextRequest, authResult: any, ...args: T) => Promise<NextResponse>,
  auditAction: string,
  getAuditDescription: (req: NextRequest, ...args: T) => string,
  requiredRole: 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await adminPermissionMiddleware(req, requiredRole)
      
      if (authResult instanceof NextResponse) {
        return authResult // Erro de autenticação
      }

      // Executar handler
      const response = await handler(req, authResult, ...args)
      
      // Se a operação foi bem-sucedida (status 2xx), criar log de auditoria
      if (response.status >= 200 && response.status < 300) {
        await createAuditLog(
          authResult.user!.id,
          {
            action: auditAction,
            description: getAuditDescription(req, ...args)
          },
          req
        )
      }

      return response
    } catch (error) {
      console.error('Admin API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Rate limiting específico para admin (mais permissivo que usuários normais)
 */
export class AdminRateLimit {
  private static requests = new Map<string, number[]>()
  
  static check(
    identifier: string,
    windowMs: number = 60000, // 1 minuto
    maxRequests: number = 100  // 100 requests por minuto
  ): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Limpar requests antigas
    const userRequests = this.requests.get(identifier) || []
    const validRequests = userRequests.filter(time => time > windowStart)
    
    if (validRequests.length >= maxRequests) {
      return false // Rate limit exceeded
    }
    
    // Adicionar request atual
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }
}

/**
 * Middleware de rate limiting para admin
 */
export async function adminRateLimitMiddleware(
  req: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const authResult = await verifyAdminAuth(req)
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const identifier = `admin_${authResult.user.id}`
  
  if (!AdminRateLimit.check(identifier, windowMs, maxRequests)) {
    // Log tentativa de rate limit
    await createAuditLog(
      authResult.user.id,
      {
        action: 'RATE_LIMIT_EXCEEDED',
        description: `Rate limit exceeded: ${maxRequests} requests in ${windowMs}ms`
      },
      req
    )
    
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  return null // Permitir request
}

/**
 * Utilitário para extrair parâmetros da URL para logs de auditoria
 */
export function extractRouteParams(req: NextRequest): Record<string, string> {
  const url = new URL(req.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  
  // Tentar extrair IDs e parâmetros comuns das rotas admin
  const params: Record<string, string> = {}
  
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    const nextSegment = pathSegments[i + 1]
    
    if (nextSegment && segment === 'admin') {
      // Detectar padrões como /admin/users/[userId] ou /admin/items/[itemId]
      const resourceType = pathSegments[i + 1]
      const resourceId = pathSegments[i + 2]
      
      if (resourceId && !['create', 'edit', 'delete'].includes(resourceId)) {
        params[`${resourceType}Id`] = resourceId
      }
    }
  }
  
  return params
}

/**
 * Função helper para gerar descrições de auditoria padronizadas
 */
export function createAuditDescription(
  action: string,
  resource: string,
  resourceId?: string,
  additionalInfo?: string
): string {
  let description = `${action} ${resource}`
  
  if (resourceId) {
    description += ` (ID: ${resourceId})`
  }
  
  if (additionalInfo) {
    description += ` - ${additionalInfo}`
  }
  
  return description
}