import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setupAdmins() {
  console.log('🔧 Setting up admin users...')
  
  const newPassword = 'M@22te24us'
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  try {
    // 1. Update existing admin user (admin@admin.com)
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    })

    if (existingAdmin) {
      console.log('📝 Updating existing admin user...')
      await prisma.user.update({
        where: { email: 'admin@admin.com' },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          name: 'Administrador'
        }
      })
      console.log('✅ Admin user updated successfully!')
      console.log('📧 Email: admin@admin.com')
      console.log('🔐 Password: M@22te24us')
      console.log('👤 Role: ADMIN')
    } else {
      console.log('📝 Creating admin user...')
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@admin.com',
          password: hashedPassword,
          role: 'ADMIN',
          credits: 10000
        }
      })
      console.log('✅ Admin user created successfully!')
      console.log('📧 Email: admin@admin.com')
      console.log('🔐 Password: M@22te24us')
      console.log('👤 Role: ADMIN')
    }

    // 2. Create or update SUPER_ADMIN user
    const superAdminEmail = 'superadmin@admin.com'
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    })

    if (existingSuperAdmin) {
      console.log('📝 Updating existing super admin user...')
      await prisma.user.update({
        where: { email: superAdminEmail },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          name: 'Super Administrador'
        }
      })
      console.log('✅ Super admin user updated successfully!')
    } else {
      console.log('📝 Creating super admin user...')
      await prisma.user.create({
        data: {
          name: 'Super Administrador',
          email: superAdminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          credits: 10000
        }
      })
      console.log('✅ Super admin user created successfully!')
    }
    
    console.log('📧 Email: superadmin@admin.com')
    console.log('🔐 Password: M@22te24us')
    console.log('👤 Role: SUPER_ADMIN')

    // 3. Create UserStats for both users if they don't exist
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: { userStats: true }
    })

    const superAdminUser = await prisma.user.findUnique({
      where: { email: superAdminEmail },
      include: { userStats: true }
    })

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
      console.log('✅ Admin user stats created')
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
      console.log('✅ Super admin user stats created')
    }

    console.log('\n🎉 Admin setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 ADMIN USER:')
    console.log('   📧 Email: admin@admin.com')
    console.log('   🔐 Password: M@22te24us')
    console.log('   🎭 Role: ADMIN')
    console.log('   💰 Credits: 10000')
    console.log('')
    console.log('👑 SUPER ADMIN USER:')
    console.log('   📧 Email: superadmin@admin.com')
    console.log('   🔐 Password: M@22te24us')
    console.log('   🎭 Role: SUPER_ADMIN')
    console.log('   💰 Credits: 10000')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  Note: Both users will NOT appear in rankings')

  } catch (error) {
    console.error('❌ Error setting up admins:', error)
    throw error
  }
}

setupAdmins()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })