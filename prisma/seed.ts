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
    update: { credits: 9999, role: 'ADMIN' },
    create: {
      email: 'admin@admin.com',
      name: 'Administrator',
      password: adminPassword,
      credits: 9999,
      role: 'ADMIN',
      emailVerified: true
    }
  })
  // Create sample items for each rarity
  const items = [
    // Common items (COMUM - 5 créditos)
    { name: 'Poção de Vida Básica', description: 'Uma poção simples de cura', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/common-potion.jpg' },
    { name: 'Espada de Ferro', description: 'Uma espada comum de ferro', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/iron-sword.jpg' },
    { name: 'Escudo de Madeira', description: 'Um escudo básico de madeira', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/wood-shield.jpg' },
    { name: 'Adaga de Pedra', description: 'Uma adaga simples de pedra', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/stone-dagger.jpg' },
    { name: 'Corda de Cânhamo', description: 'Uma corda resistente para escaladas', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/hemp-rope.jpg' },
    { name: 'Tocha Comum', description: 'Uma tocha simples para iluminar o caminho', rarity: Rarity.COMUM, value: 5, imageUrl: '/items/common-torch.jpg' },
    
    // Uncommon items (INCOMUM - 15 créditos)
    { name: 'Anel de Força', description: 'Um anel que aumenta a força', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/strength-ring.jpg' },
    { name: 'Arco Élfico', description: 'Um arco feito pelos elfos', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/elven-bow.jpg' },
    { name: 'Armadura de Couro', description: 'Uma armadura resistente de couro', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/leather-armor.jpg' },
    { name: 'Espada de Prata', description: 'Uma espada brilhante de prata', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/silver-sword.jpg' },
    { name: 'Botas de Velocidade', description: 'Botas que aumentam a velocidade', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/speed-boots.jpg' },
    { name: 'Colar de Mana', description: 'Um colar que regenera mana', rarity: Rarity.INCOMUM, value: 15, imageUrl: '/items/mana-necklace.jpg' },
    
    // Rare items (RARO - 40 créditos)
    { name: 'Espada Flamejante', description: 'Uma espada que queima os inimigos', rarity: Rarity.RARO, value: 40, imageUrl: '/items/flame-sword.jpg' },
    { name: 'Cetro de Gelo', description: 'Um cetro que controla o gelo', rarity: Rarity.RARO, value: 40, imageUrl: '/items/ice-staff.jpg' },
    { name: 'Escudo Élfico Encantado', description: 'Um escudo élfico com proteção mágica', rarity: Rarity.RARO, value: 40, imageUrl: '/items/enchanted-elven-shield.jpg' },
    { name: 'Varinha de Raio', description: 'Uma varinha que dispara raios', rarity: Rarity.RARO, value: 40, imageUrl: '/items/lightning-wand.jpg' },
    
    // Epic items (ÉPICO - 100 créditos)
    { name: 'Coroa do Rei Dragão', description: 'Uma coroa lendária de um antigo rei', rarity: Rarity.EPICO, value: 100, imageUrl: '/items/dragon-crown.jpg' },
    { name: 'Machado dos Titãs', description: 'Um machado forjado pelos titãs', rarity: Rarity.EPICO, value: 100, imageUrl: '/items/titan-axe.jpg' },
    { name: 'Armadura de Dragão', description: 'Uma armadura feita de escamas de dragão', rarity: Rarity.EPICO, value: 100, imageUrl: '/items/dragon-armor.jpg' },
    
    // Legendary items (LENDÁRIO - 500 créditos)
    { name: 'Excalibur', description: 'A espada lendária do Rei Arthur', rarity: Rarity.LENDARIO, value: 500, imageUrl: '/items/excalibur.jpg' },
    { name: 'Orb of Eternal Light', description: 'Um orbe com poder de luz eterna', rarity: Rarity.LENDARIO, value: 500, imageUrl: '/items/eternal-orb.jpg' },
    { name: 'Mjolnir', description: 'O martelo lendário de Thor', rarity: Rarity.LENDARIO, value: 500, imageUrl: '/items/mjolnir.jpg' },
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
      isActive: true,
    },
  })

  const silverPack = await prisma.pack.create({
    data: {
      type: PackType.SILVER,
      name: 'Pacote Prata',
      description: 'Um pacote intermediário com boas chances de itens',
      price: 40,
      isActive: true,
    },
  })

  const goldPack = await prisma.pack.create({
    data: {
      type: PackType.GOLD,
      name: 'Pacote Ouro',
      description: 'Um pacote premium com maiores chances de itens raros',
      price: 75,
      isActive: true,
    },
  })

  const platinumPack = await prisma.pack.create({
    data: {
      type: PackType.PLATINUM,
      name: 'Pacote Platina',
      description: 'Um pacote luxuoso com excelentes chances',
      price: 150,
      isActive: true,
    },
  })

  const diamondPack = await prisma.pack.create({
    data: {
      type: PackType.DIAMOND,
      name: 'Pacote Diamante',
      description: 'O pacote supremo com as melhores chances',
      price: 300,
      isActive: true,
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