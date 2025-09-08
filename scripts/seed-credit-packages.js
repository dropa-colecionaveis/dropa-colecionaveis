const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCreditPackages() {
  console.log('🌱 Seeding credit packages...')

  // Pacotes de créditos atuais do sistema
  const creditPackages = [
    { credits: 100, price: 10, isPopular: false, displayOrder: 1 },
    { credits: 250, price: 20, isPopular: true, displayOrder: 2 },
    { credits: 500, price: 35, isPopular: false, displayOrder: 3 },
    { credits: 1000, price: 60, isPopular: false, displayOrder: 4 },
    { credits: 2500, price: 120, isPopular: false, displayOrder: 5 },
  ]

  try {
    for (const packageData of creditPackages) {
      const existing = await prisma.creditPackage.findFirst({
        where: {
          credits: packageData.credits,
          price: packageData.price
        }
      })

      if (!existing) {
        const created = await prisma.creditPackage.create({
          data: packageData
        })
        console.log(`✅ Created package: ${created.credits} credits for R$ ${created.price}`)
      } else {
        console.log(`⏭️  Package already exists: ${packageData.credits} credits for R$ ${packageData.price}`)
      }
    }

    console.log('🎉 Credit packages seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding credit packages:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCreditPackages()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })