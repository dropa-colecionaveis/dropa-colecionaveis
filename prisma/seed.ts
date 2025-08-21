import { PrismaClient, Rarity, PackType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test user with credits
  console.log('Creating users...')
  const testPassword = await bcrypt.hash('123456', 10)
  await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: { credits: 1000 },
    create: {
      email: 'test@test.com',
      name: 'Test User',
      password: testPassword,
      credits: 1000
    }
  })

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: { credits: 9999 },
    create: {
      email: 'admin@admin.com',
      name: 'Administrator',
      password: adminPassword,
      credits: 9999
    }
  })
  // Create sample items for each rarity
  const items = [
    // Common items
    { name: 'Poção de Vida Básica', description: 'Uma poção simples de cura', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/common-potion.jpg' },
    { name: 'Espada de Ferro', description: 'Uma espada comum de ferro', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/iron-sword.jpg' },
    { name: 'Escudo de Madeira', description: 'Um escudo básico de madeira', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/wood-shield.jpg' },
    
    // Uncommon items
    { name: 'Anel de Força', description: 'Um anel que aumenta a força', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/strength-ring.jpg' },
    { name: 'Arco Élfico', description: 'Um arco feito pelos elfos', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/elven-bow.jpg' },
    { name: 'Armadura de Couro', description: 'Uma armadura resistente de couro', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/leather-armor.jpg' },
    
    // Rare items
    { name: 'Espada Flamejante', description: 'Uma espada que queima os inimigos', rarity: Rarity.RARO, value: 40, imageUrl: '/items/flame-sword.jpg' },
    { name: 'Cetro de Gelo', description: 'Um cetro que controla o gelo', rarity: Rarity.RARO, value: 40, imageUrl: '/items/ice-staff.jpg' },
    
    // Epic items
    { name: 'Coroa do Rei Dragão', description: 'Uma coroa lendária de um antigo rei', rarity: Rarity.EPICO, value: 100, imageUrl: '/items/dragon-crown.jpg' },
    { name: 'Machado dos Titãs', description: 'Um machado forjado pelos titãs', rarity: Rarity.EPICO, value: 100, imageUrl: '/items/titan-axe.jpg' },
    
    // Legendary items
    { name: 'Excalibur', description: 'A espada lendária do Rei Arthur', rarity: Rarity.LENDARIO, value: 500, imageUrl: '/items/excalibur.jpg' },
    { name: 'Orb of Eternal Light', description: 'Um orbe com poder de luz eterna', rarity: Rarity.LENDARIO, value: 500, imageUrl: '/items/eternal-orb.jpg' },
  ]

  console.log('Creating items...')
  // Clear existing items first
  await prisma.item.deleteMany({})
  
  for (const itemData of items) {
    await prisma.item.create({
      data: itemData,
    })
  }

  // Create packs
  console.log('Creating packs...')
  // Clear existing packs first
  await prisma.pack.deleteMany({})
  
  const bronzePack = await prisma.pack.create({
    data: {
      type: PackType.BRONZE,
      name: 'Pacote Bronze',
      description: 'Um pacote básico com boa chance de itens comuns e incomuns',
      price: 25,
    },
  })

  const silverPack = await prisma.pack.create({
    data: {
      type: PackType.SILVER,
      name: 'Pacote Prata',
      description: 'Um pacote intermediário com boas chances de itens',
      price: 40,
    },
  })

  const goldPack = await prisma.pack.create({
    data: {
      type: PackType.GOLD,
      name: 'Pacote Ouro',
      description: 'Um pacote premium com maiores chances de itens raros',
      price: 75,
    },
  })

  const platinumPack = await prisma.pack.create({
    data: {
      type: PackType.PLATINUM,
      name: 'Pacote Platina',
      description: 'Um pacote luxuoso com excelentes chances',
      price: 150,
    },
  })

  const diamondPack = await prisma.pack.create({
    data: {
      type: PackType.DIAMOND,
      name: 'Pacote Diamante',
      description: 'O pacote supremo com as melhores chances',
      price: 300,
    },
  })

  // Create pack probabilities for Bronze pack
  console.log('Creating Bronze pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: Rarity.COMUM, percentage: 60 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: Rarity.INCOMUM, percentage: 25 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: Rarity.RARO, percentage: 10 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: Rarity.EPICO, percentage: 4 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: Rarity.LENDARIO, percentage: 1 },
  })

  // Create pack probabilities for Gold pack
  console.log('Creating Gold pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: Rarity.COMUM, percentage: 40 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: Rarity.INCOMUM, percentage: 30 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: Rarity.RARO, percentage: 20 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: Rarity.EPICO, percentage: 8 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: Rarity.LENDARIO, percentage: 2 },
  })

  // Create pack probabilities for Silver pack
  console.log('Creating Silver pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: Rarity.COMUM, percentage: 50 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: Rarity.INCOMUM, percentage: 28 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: Rarity.RARO, percentage: 15 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: Rarity.EPICO, percentage: 5 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: Rarity.LENDARIO, percentage: 2 },
  })

  // Create pack probabilities for Platinum pack
  console.log('Creating Platinum pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: Rarity.COMUM, percentage: 25 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: Rarity.INCOMUM, percentage: 35 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: Rarity.RARO, percentage: 25 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: Rarity.EPICO, percentage: 10 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: Rarity.LENDARIO, percentage: 5 },
  })

  // Create pack probabilities for Diamond pack
  console.log('Creating Diamond pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: Rarity.COMUM, percentage: 15 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: Rarity.INCOMUM, percentage: 30 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: Rarity.RARO, percentage: 30 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: Rarity.EPICO, percentage: 15 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: Rarity.LENDARIO, percentage: 10 },
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })