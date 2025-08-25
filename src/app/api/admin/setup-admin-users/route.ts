import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json()

    // Verificar secret de segurança
    if (secret !== 'setup-admins-2025') {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    const newPassword = 'M@22te24us'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const results = {
      admin: { action: '', email: 'admin@admin.com' },
      superAdmin: { action: '', email: 'superadmin@admin.com' }
    }

    // 1. Setup ADMIN user
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    })

    if (existingAdmin) {
      await prisma.user.update({
        where: { email: 'admin@admin.com' },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          name: 'Administrador'
        }
      })
      results.admin.action = 'updated'
    } else {
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@admin.com',
          password: hashedPassword,
          role: 'ADMIN',
          credits: 10000
        }
      })
      results.admin.action = 'created'
    }

    // 2. Setup SUPER_ADMIN user
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@admin.com' }
    })

    if (existingSuperAdmin) {
      await prisma.user.update({
        where: { email: 'superadmin@admin.com' },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          name: 'Super Administrador'
        }
      })
      results.superAdmin.action = 'updated'
    } else {
      await prisma.user.create({
        data: {
          name: 'Super Administrador',
          email: 'superadmin@admin.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          credits: 10000
        }
      })
      results.superAdmin.action = 'created'
    }

    // 3. Ensure UserStats exist for both users
    const [adminUser, superAdminUser] = await Promise.all([
      prisma.user.findUnique({
        where: { email: 'admin@admin.com' },
        include: { userStats: true }
      }),
      prisma.user.findUnique({
        where: { email: 'superadmin@admin.com' },
        include: { userStats: true }
      })
    ])

    if (adminUser && !adminUser.userStats) {
      await prisma.userStats.create({
        data: {
          userId: adminUser.id,
          level: 1,
          totalXP: 0,
          totalCreditsSpent: 0,
          totalPacksOpened: 0,
          totalItemsCollected: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityAt: new Date()
        }
      })
    }

    if (superAdminUser && !superAdminUser.userStats) {
      await prisma.userStats.create({
        data: {
          userId: superAdminUser.id,
          level: 1,
          totalXP: 0,
          totalCreditsSpent: 0,
          totalPacksOpened: 0,
          totalItemsCollected: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityAt: new Date()
        }
      })
    }

    return NextResponse.json({
      message: 'Admin users setup completed successfully!',
      results,
      credentials: {
        admin: {
          email: 'admin@admin.com',
          password: 'M@22te24us',
          role: 'ADMIN'
        },
        superAdmin: {
          email: 'superadmin@admin.com',
          password: 'M@22te24us',
          role: 'SUPER_ADMIN'
        }
      },
      note: 'Both users will NOT appear in rankings due to their admin roles'
    })

  } catch (error) {
    console.error('Error setting up admin users:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}