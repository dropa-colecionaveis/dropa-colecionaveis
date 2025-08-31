import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

export interface AdminAuthResult {
  success: boolean
  user?: AdminUser
  error?: string
  statusCode?: number
}

/**
 * Verifica se o usuário atual tem permissão de administrador
 */
export async function verifyAdminAuth(req?: NextRequest): Promise<AdminAuthResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized - No session',
        statusCode: 401
      }
    }

    // Buscar usuário no banco com role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 404
      }
    }

    if (!user.isActive) {
      return {
        success: false,
        error: 'Account disabled',
        statusCode: 403
      }
    }

    // Verificar se tem role de admin
    if (!isAdminRole(user.role)) {
      return {
        success: false,
        error: 'Insufficient permissions - Admin access required',
        statusCode: 403
      }
    }

    // Registrar último login se for primeira verificação da sessão
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }

  } catch (error) {
    console.error('Admin auth verification error:', error)
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500
    }
  }
}

/**
 * Verifica se um role é considerado admin
 */
export function isAdminRole(role: UserRole): boolean {
  return ['ADMIN', 'SUPER_ADMIN'].includes(role)
}

/**
 * Verifica se um role é considerado moderador ou superior
 */
export function isModeratorRole(role: UserRole): boolean {
  return ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)
}

/**
 * Verifica se um role é considerado super admin
 */
export function isSuperAdminRole(role: UserRole): boolean {
  return role === 'SUPER_ADMIN'
}

/**
 * Middleware helper para verificar permissões específicas
 */
export async function requirePermission(
  req: NextRequest,
  requiredRole: 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'
): Promise<AdminAuthResult> {
  const authResult = await verifyAdminAuth(req)
  
  if (!authResult.success || !authResult.user) {
    return authResult
  }

  const hasPermission = (() => {
    switch (requiredRole) {
      case 'MODERATOR':
        return isModeratorRole(authResult.user.role)
      case 'ADMIN':
        return isAdminRole(authResult.user.role)
      case 'SUPER_ADMIN':
        return isSuperAdminRole(authResult.user.role)
      default:
        return false
    }
  })()

  if (!hasPermission) {
    return {
      success: false,
      error: `Insufficient permissions - ${requiredRole} access required`,
      statusCode: 403
    }
  }

  return authResult
}

/**
 * Cria um usuário admin inicial (usar apenas em desenvolvimento/setup)
 */
export async function createInitialAdmin(
  email: string,
  password: string,
  name?: string
): Promise<AdminUser> {
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'SUPER_ADMIN',
      password: hashedPassword,
      name: name || 'Super Admin'
    },
    create: {
      email,
      password: hashedPassword,
      name: name || 'Super Admin',
      role: 'SUPER_ADMIN',
      credits: 0
    }
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
}

/**
 * Lista de ações administrativas permitidas por role
 */
export const ADMIN_PERMISSIONS = {
  MODERATOR: [
    'view_users',
    'moderate_marketplace',
    'view_reports',
    'manage_user_items'
  ],
  ADMIN: [
    'view_users',
    'moderate_marketplace',
    'view_reports',
    'manage_user_items',
    'manage_items',
    'manage_packs',
    'manage_collections',
    'manage_themes',
    'view_admin_stats',
    'manage_achievements'
  ],
  SUPER_ADMIN: [
    'view_users',
    'moderate_marketplace',
    'view_reports',
    'manage_user_items',
    'manage_items',
    'manage_packs',
    'manage_collections',
    'manage_themes',
    'view_admin_stats',
    'manage_achievements',
    'manage_admins',
    'system_backup',
    'system_restore',
    'view_audit_logs',
    'manage_system_settings'
  ]
} as const

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function hasPermission(
  role: UserRole,
  permission: string
): boolean {
  const rolePermissions = ADMIN_PERMISSIONS[role as keyof typeof ADMIN_PERMISSIONS]
  return rolePermissions?.includes(permission as any) || false
}

/**
 * Verifica se um usuário é admin (função simples para compatibilidade)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true }
    })
    
    if (!user || !user.isActive) {
      return false
    }
    
    return isAdminRole(user.role)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}