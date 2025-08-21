import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const adminEmail = 'admin@admin.com'
  const adminPassword = 'admin123'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail)
    return
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: adminEmail,
      password: hashedPassword,
      credits: 10000, // Give admin lots of credits for testing
    }
  })

  console.log('✅ Admin user created successfully!')
  console.log('📧 Email:', adminEmail)
  console.log('🔐 Password:', adminPassword)
  console.log('💰 Credits:', admin.credits)
}

createAdmin()
  .catch((e) => {
    console.error('❌ Error creating admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })