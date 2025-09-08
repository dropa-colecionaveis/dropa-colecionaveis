const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedPackTypes() {
  console.log('🌱 Seeding pack types...')

  const packTypes = [
    {
      name: 'BRONZE',
      displayName: 'Bronze',
      emoji: '🥉',
      color: '#cd7f32',
      description: 'Pacote básico com boa chance de itens comuns e incomuns',
      isDefault: true
    },
    {
      name: 'SILVER',
      displayName: 'Prata',
      emoji: '🥈',
      color: '#c0c0c0',
      description: 'Pacote intermediário com chances equilibradas',
      isDefault: true
    },
    {
      name: 'GOLD',
      displayName: 'Ouro',
      emoji: '🥇',
      color: '#ffd700',
      description: 'Pacote premium com melhores chances de itens raros',
      isDefault: true
    },
    {
      name: 'PLATINUM',
      displayName: 'Platina',
      emoji: '💎',
      color: '#e5e4e2',
      description: 'Pacote de alta qualidade com ótimas chances',
      isDefault: true
    },
    {
      name: 'DIAMOND',
      displayName: 'Diamante',
      emoji: '💠',
      color: '#b9f2ff',
      description: 'Pacote supremo com as melhores chances de itens lendários',
      isDefault: true
    }
  ]

  try {
    for (const typeData of packTypes) {
      const existing = await prisma.packTypeCustom.findUnique({
        where: { name: typeData.name }
      })

      if (!existing) {
        const created = await prisma.packTypeCustom.create({
          data: typeData
        })
        console.log(`✅ Created pack type: ${created.displayName} (${created.emoji})`)
      } else {
        console.log(`⏭️  Pack type already exists: ${typeData.displayName}`)
      }
    }

    console.log('🎉 Pack types seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding pack types:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedPackTypes()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })