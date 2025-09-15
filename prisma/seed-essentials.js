const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedEssentials() {
  console.log('🔧 Populando dados essenciais para funcionamento do sistema...')

  // 1. Credit Packages - ESSENCIAL para compra de créditos
  console.log('💰 Criando pacotes de créditos...')
  
  const creditPackages = [
    {
      credits: 100,
      price: 5.00,
      isPopular: false,
      displayOrder: 1
    },
    {
      credits: 250,
      price: 10.00,
      isPopular: false,
      displayOrder: 2
    },
    {
      credits: 500,
      price: 18.00,
      isPopular: true, // Marcado como popular
      displayOrder: 3
    },
    {
      credits: 1000,
      price: 30.00,
      isPopular: false,
      displayOrder: 4
    },
    {
      credits: 2500,
      price: 70.00,
      isPopular: false,
      displayOrder: 5
    },
    {
      credits: 5000,
      price: 120.00,
      isPopular: false,
      displayOrder: 6
    }
  ]

  for (const packageData of creditPackages) {
    // Check if package already exists
    const existing = await prisma.creditPackage.findFirst({
      where: {
        credits: packageData.credits,
        price: packageData.price
      }
    })

    if (existing) {
      console.log(`   📦 Pacote ${packageData.credits} créditos já existe`)
      await prisma.creditPackage.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          ...packageData
        }
      })
    } else {
      console.log(`   ✨ Criando pacote ${packageData.credits} créditos`)
      await prisma.creditPackage.create({
        data: packageData
      })
    }
  }

  // 2. Pack Types Custom - ESSENCIAL para daily rewards
  console.log('📋 Criando tipos de pack customizados...')
  
  const packTypesCustom = [
    {
      name: 'bronze',
      displayName: 'Bronze',
      emoji: '🥉',
      color: '#CD7F32',
      description: 'Pack básico com itens comuns e incomuns',
      isDefault: true
    },
    {
      name: 'silver',
      displayName: 'Prata',
      emoji: '🥈', 
      color: '#C0C0C0',
      description: 'Pack intermediário com chances melhores'
    },
    {
      name: 'gold',
      displayName: 'Ouro',
      emoji: '🥇',
      color: '#FFD700',
      description: 'Pack premium com itens raros e épicos'
    },
    {
      name: 'platinum',
      displayName: 'Platina',
      emoji: '💎',
      color: '#E5E4E2',
      description: 'Pack exclusivo com chances de lendários'
    },
    {
      name: 'diamond',
      displayName: 'Diamante',
      emoji: '💠',
      color: '#B9F2FF',
      description: 'Pack supremo com as melhores chances'
    }
  ]

  for (const packType of packTypesCustom) {
    await prisma.packTypeCustom.upsert({
      where: { name: packType.name },
      update: {
        isActive: true,
        ...packType
      },
      create: packType
    })
  }

  // 3. Vincular daily rewards com pack types (se necessário)
  console.log('🔗 Verificando vinculação de daily rewards com pack types...')
  
  const bronzePackType = await prisma.packTypeCustom.findFirst({
    where: { name: 'bronze' }
  })

  // Atualizar daily rewards que são do tipo PACK para referenciar o bronze pack
  await prisma.dailyReward.updateMany({
    where: {
      rewardType: 'PACK',
      packTypeId: null
    },
    data: {
      packTypeId: bronzePackType.id
    }
  })

  console.log('✅ Dados essenciais criados com sucesso!')
  console.log('📊 Resumo:')
  console.log(`   💰 Pacotes de créditos: ${creditPackages.length}`)
  console.log(`   📋 Tipos de pack: ${packTypesCustom.length}`)
  console.log('🚀 Sistema pronto para funcionamento completo!')
}

seedEssentials()
  .catch((e) => {
    console.error('❌ Erro ao popular dados essenciais:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })