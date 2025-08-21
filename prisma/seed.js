const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
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

  // Create sample items for each rarity
  const items = [
    // Common items
    { name: 'Poção de Vida Básica', description: 'Uma poção simples de cura', rarity: 'COMUM', value: 5, imageUrl: '/items/common-potion.jpg' },
    { name: 'Espada de Ferro', description: 'Uma espada comum de ferro', rarity: 'COMUM', value: 5, imageUrl: '/items/iron-sword.jpg' },
    { name: 'Escudo de Madeira', description: 'Um escudo básico de madeira', rarity: 'COMUM', value: 5, imageUrl: '/items/wood-shield.jpg' },
    
    // Uncommon items
    { name: 'Anel de Força', description: 'Um anel que aumenta a força', rarity: 'INCOMUM', value: 15, imageUrl: '/items/strength-ring.jpg' },
    { name: 'Arco Élfico', description: 'Um arco feito pelos elfos', rarity: 'INCOMUM', value: 15, imageUrl: '/items/elven-bow.jpg' },
    { name: 'Armadura de Couro', description: 'Uma armadura resistente de couro', rarity: 'INCOMUM', value: 15, imageUrl: '/items/leather-armor.jpg' },
    
    // Rare items
    { name: 'Espada Flamejante', description: 'Uma espada que queima os inimigos', rarity: 'RARO', value: 40, imageUrl: '/items/flame-sword.jpg' },
    { name: 'Cetro de Gelo', description: 'Um cetro que controla o gelo', rarity: 'RARO', value: 40, imageUrl: '/items/ice-staff.jpg' },
    
    // Epic items
    { name: 'Coroa do Rei Dragão', description: 'Uma coroa lendária de um antigo rei', rarity: 'EPICO', value: 100, imageUrl: '/items/dragon-crown.jpg' },
    { name: 'Machado dos Titãs', description: 'Um machado forjado pelos titãs', rarity: 'EPICO', value: 100, imageUrl: '/items/titan-axe.jpg' },
    
    // Legendary items
    { name: 'Excalibur', description: 'A espada lendária do Rei Arthur', rarity: 'LENDARIO', value: 500, imageUrl: '/items/excalibur.jpg' },
    { name: 'Orb of Eternal Light', description: 'Um orbe com poder de luz eterna', rarity: 'LENDARIO', value: 500, imageUrl: '/items/eternal-orb.jpg' },
  ]

  // Create collections first
  console.log('Creating collections...')
  await prisma.collection.deleteMany({})
  
  // Get existing themes
  const medievalTheme = await prisma.theme.findUnique({ where: { name: 'medieval' }})
  const fantasyTheme = await prisma.theme.findUnique({ where: { name: 'fantasy' }})
  const classicTheme = await prisma.theme.findUnique({ where: { name: 'classic' }})
  
  const medievalCollection = await prisma.collection.create({
    data: {
      name: 'Guerreiros Medievais',
      description: 'Uma coleção épica de armas e armaduras da era medieval',
      themeId: medievalTheme?.id,
      imageUrl: '/collections/medieval.jpg',
      maxItems: 100,
      isActive: true,
      isLimited: false
    }
  })

  const mysticalCollection = await prisma.collection.create({
    data: {
      name: 'Criaturas Místicas',
      description: 'Coleção limitada de criaturas mágicas e artefatos místicos',
      themeId: fantasyTheme?.id,
      imageUrl: '/collections/mystical.jpg',
      maxItems: 50,
      isActive: true,
      isLimited: true
    }
  })

  const classicCollection = await prisma.collection.create({
    data: {
      name: 'Tesouro Clássico',
      description: 'Itens tradicionais para colecionadores iniciantes',
      themeId: classicTheme?.id,
      imageUrl: '/collections/classic.jpg',
      maxItems: 75,
      isActive: true,
      isLimited: false
    }
  })

  console.log('Creating items...')
  // Clear existing items first
  await prisma.item.deleteMany({})
  
  // Update items to include collection assignments
  const updatedItems = [
    // Medieval Collection Items
    { name: 'Espada de Ferro', description: 'Uma espada comum de ferro', rarity: 'COMUM', value: 5, imageUrl: '/items/iron-sword.jpg', collectionId: medievalCollection.id, itemNumber: 1 },
    { name: 'Escudo de Madeira', description: 'Um escudo básico de madeira', rarity: 'COMUM', value: 5, imageUrl: '/items/wood-shield.jpg', collectionId: medievalCollection.id, itemNumber: 2 },
    { name: 'Armadura de Couro', description: 'Uma armadura resistente de couro', rarity: 'INCOMUM', value: 15, imageUrl: '/items/leather-armor.jpg', collectionId: medievalCollection.id, itemNumber: 3 },
    { name: 'Espada Flamejante', description: 'Uma espada que queima os inimigos', rarity: 'RARO', value: 40, imageUrl: '/items/flame-sword.jpg', collectionId: medievalCollection.id, itemNumber: 4 },
    { name: 'Coroa do Rei Dragão', description: 'Uma coroa lendária de um antigo rei', rarity: 'EPICO', value: 100, imageUrl: '/items/dragon-crown.jpg', collectionId: medievalCollection.id, itemNumber: 5 },
    { name: 'Excalibur', description: 'A espada lendária do Rei Arthur', rarity: 'LENDARIO', value: 500, imageUrl: '/items/excalibur.jpg', collectionId: medievalCollection.id, itemNumber: 6 },
    
    // Mystical Collection Items  
    { name: 'Cetro de Gelo', description: 'Um cetro que controla o gelo', rarity: 'RARO', value: 40, imageUrl: '/items/ice-staff.jpg', collectionId: mysticalCollection.id, itemNumber: 1 },
    { name: 'Orb of Eternal Light', description: 'Um orbe com poder de luz eterna', rarity: 'LENDARIO', value: 500, imageUrl: '/items/eternal-orb.jpg', collectionId: mysticalCollection.id, itemNumber: 2 },
    { name: 'Machado dos Titãs', description: 'Um machado forjado pelos titãs', rarity: 'EPICO', value: 100, imageUrl: '/items/titan-axe.jpg', collectionId: mysticalCollection.id, itemNumber: 3 },
    
    // Classic Collection Items
    { name: 'Poção de Vida Básica', description: 'Uma poção simples de cura', rarity: 'COMUM', value: 5, imageUrl: '/items/common-potion.jpg', collectionId: classicCollection.id, itemNumber: 1 },
    { name: 'Anel de Força', description: 'Um anel que aumenta a força', rarity: 'INCOMUM', value: 15, imageUrl: '/items/strength-ring.jpg', collectionId: classicCollection.id, itemNumber: 2 },
    { name: 'Arco Élfico', description: 'Um arco feito pelos elfos', rarity: 'INCOMUM', value: 15, imageUrl: '/items/elven-bow.jpg', collectionId: classicCollection.id, itemNumber: 3 }
  ]
  
  for (const itemData of updatedItems) {
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
      type: 'BRONZE',
      name: 'Pacote Bronze',
      description: 'Um pacote básico com boa chance de itens comuns e incomuns',
      price: 25,
    },
  })

  const silverPack = await prisma.pack.create({
    data: {
      type: 'SILVER',
      name: 'Pacote Prata',
      description: 'Um pacote intermediário com boas chances de itens',
      price: 40,
    },
  })

  const goldPack = await prisma.pack.create({
    data: {
      type: 'GOLD',
      name: 'Pacote Ouro',
      description: 'Um pacote premium com maiores chances de itens raros',
      price: 75,
    },
  })

  const platinumPack = await prisma.pack.create({
    data: {
      type: 'PLATINUM',
      name: 'Pacote Platina',
      description: 'Um pacote luxuoso com excelentes chances',
      price: 150,
    },
  })

  const diamondPack = await prisma.pack.create({
    data: {
      type: 'DIAMOND',
      name: 'Pacote Diamante',
      description: 'O pacote supremo com as melhores chances',
      price: 300,
    },
  })

  // Create pack probabilities for Bronze pack
  console.log('Creating Bronze pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: 'COMUM', percentage: 60 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: 'INCOMUM', percentage: 25 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: 'RARO', percentage: 10 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: 'EPICO', percentage: 4 },
  })
  await prisma.packProbability.create({
    data: { packId: bronzePack.id, rarity: 'LENDARIO', percentage: 1 },
  })

  // Create pack probabilities for Silver pack
  console.log('Creating Silver pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: 'COMUM', percentage: 50 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: 'INCOMUM', percentage: 28 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: 'RARO', percentage: 15 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: 'EPICO', percentage: 5 },
  })
  await prisma.packProbability.create({
    data: { packId: silverPack.id, rarity: 'LENDARIO', percentage: 2 },
  })

  // Create pack probabilities for Gold pack
  console.log('Creating Gold pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: 'COMUM', percentage: 40 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: 'INCOMUM', percentage: 30 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: 'RARO', percentage: 20 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: 'EPICO', percentage: 8 },
  })
  await prisma.packProbability.create({
    data: { packId: goldPack.id, rarity: 'LENDARIO', percentage: 2 },
  })

  // Create pack probabilities for Platinum pack
  console.log('Creating Platinum pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: 'COMUM', percentage: 25 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: 'INCOMUM', percentage: 35 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: 'RARO', percentage: 25 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: 'EPICO', percentage: 10 },
  })
  await prisma.packProbability.create({
    data: { packId: platinumPack.id, rarity: 'LENDARIO', percentage: 5 },
  })

  // Create pack probabilities for Diamond pack
  console.log('Creating Diamond pack probabilities...')
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: 'COMUM', percentage: 15 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: 'INCOMUM', percentage: 30 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: 'RARO', percentage: 30 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: 'EPICO', percentage: 15 },
  })
  await prisma.packProbability.create({
    data: { packId: diamondPack.id, rarity: 'LENDARIO', percentage: 10 },
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