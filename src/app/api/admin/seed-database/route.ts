import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Rarity, PackType } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Simple auth check - you can make this more secure
    const { secret } = await req.json()
    if (secret !== 'seed-database-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    console.log('🌱 Starting database seed...')

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
    for (const itemData of items) {
      // Check if item already exists by name
      const existingItem = await prisma.item.findFirst({
        where: { name: itemData.name }
      })
      
      if (!existingItem) {
        await prisma.item.create({
          data: itemData
        })
      } else {
        // Update existing item
        await prisma.item.update({
          where: { id: existingItem.id },
          data: itemData
        })
      }
    }

    // Create packs
    console.log('Creating packs...')
    
    // Check if Bronze pack exists
    const bronzePack = await prisma.pack.findFirst({ where: { type: PackType.BRONZE } })
    if (!bronzePack) {
      await prisma.pack.create({
        data: {
          type: PackType.BRONZE,
          name: 'Pacote Bronze',
          description: 'Um pacote básico com boa chance de itens comuns e incomuns',
          price: 25,
          isActive: true
        }
      })
    }

    // Check if Silver pack exists
    const silverPack = await prisma.pack.findFirst({ where: { type: PackType.SILVER } })
    if (!silverPack) {
      await prisma.pack.create({
        data: {
          type: PackType.SILVER,
          name: 'Pacote Prata',
          description: 'Um pacote intermediário com boas chances de itens',
          price: 40,
          isActive: true
        }
      })
    }

    // Check if Gold pack exists
    const goldPack = await prisma.pack.findFirst({ where: { type: PackType.GOLD } })
    if (!goldPack) {
      await prisma.pack.create({
        data: {
          type: PackType.GOLD,
          name: 'Pacote Ouro',
          description: 'Um pacote premium com maiores chances de itens raros',
          price: 75,
          isActive: true
        }
      })
    }

    // Create pack probabilities  
    console.log('Creating pack probabilities...')
    const packs = await prisma.pack.findMany()
    const rarities = [Rarity.COMUM, Rarity.INCOMUM, Rarity.RARO, Rarity.EPICO, Rarity.LENDARIO]

    for (const pack of packs) {
      // Clear existing probabilities for this pack
      await prisma.packProbability.deleteMany({
        where: { packId: pack.id }
      })

      // Set probabilities based on pack type
      for (const rarity of rarities) {
        let percentage = 0

        if (pack.type === PackType.BRONZE) {
          switch (rarity) {
            case Rarity.COMUM: percentage = 60; break
            case Rarity.INCOMUM: percentage = 25; break
            case Rarity.RARO: percentage = 10; break
            case Rarity.EPICO: percentage = 4; break
            case Rarity.LENDARIO: percentage = 1; break
          }
        } else if (pack.type === PackType.SILVER) {
          switch (rarity) {
            case Rarity.COMUM: percentage = 50; break
            case Rarity.INCOMUM: percentage = 30; break
            case Rarity.RARO: percentage = 15; break
            case Rarity.EPICO: percentage = 4; break
            case Rarity.LENDARIO: percentage = 1; break
          }
        } else if (pack.type === PackType.GOLD) {
          switch (rarity) {
            case Rarity.COMUM: percentage = 40; break
            case Rarity.INCOMUM: percentage = 30; break
            case Rarity.RARO: percentage = 20; break
            case Rarity.EPICO: percentage = 8; break
            case Rarity.LENDARIO: percentage = 2; break
          }
        }

        if (percentage > 0) {
          await prisma.packProbability.upsert({
            where: {
              packId_rarity: {
                packId: pack.id,
                rarity: rarity
              }
            },
            update: {
              percentage: percentage
            },
            create: {
              packId: pack.id,
              rarity: rarity,
              percentage: percentage
            }
          })
        }
      }
    }

    console.log('✅ Database seeded successfully!')

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        users: 2,
        items: items.length,
        packs: packs.length
      }
    })

  } catch (error) {
    console.error('❌ Seed error:', error)
    return NextResponse.json({ 
      error: 'Failed to seed database', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}