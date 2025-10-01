import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  transactionOptions: {
    maxWait: 10000, // 10 seconds max wait time (reduced for faster failure)
    timeout: 30000, // 30 seconds transaction timeout (reduced)
    isolationLevel: 'ReadCommitted' // Less strict isolation for better performance
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle cleanup in serverless environments
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}