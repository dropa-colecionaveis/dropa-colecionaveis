const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixDailyRewards() {
  console.log('🔧 Corrigindo recompensas diárias conforme imagem...')

  // Buscar o pack type Bronze para as recompensas de pack
  const bronzePackType = await prisma.packTypeCustom.findFirst({
    where: { name: 'bronze' }
  })

  if (!bronzePackType) {
    console.error('❌ Pack type Bronze não encontrado!')
    return
  }

  // Padrão correto das recompensas baseado na imagem
  const correctRewards = [
    {
      day: 1,
      rewardType: 'CREDITS',
      rewardValue: 10,
      packTypeId: null,
      description: '10 créditos - Dia 1 do ciclo'
    },
    {
      day: 2, 
      rewardType: 'CREDITS',
      rewardValue: 15,
      packTypeId: null,
      description: '15 créditos - Dia 2 do ciclo'
    },
    {
      day: 3,
      rewardType: 'PACK',
      rewardValue: 1,
      packTypeId: bronzePackType.id,
      description: '1x Pack Bronze - Dia 3 do ciclo'
    },
    {
      day: 4,
      rewardType: 'CREDITS', 
      rewardValue: 25,
      packTypeId: null,
      description: '25 créditos - Dia 4 do ciclo'
    },
    {
      day: 5,
      rewardType: 'PACK',
      rewardValue: 1,
      packTypeId: bronzePackType.id,
      description: '1x Pack Bronze - Dia 5 do ciclo'
    },
    {
      day: 6,
      rewardType: 'CREDITS',
      rewardValue: 50,
      packTypeId: null,
      description: '50 créditos - Dia 6 do ciclo'
    },
    {
      day: 7,
      rewardType: 'PACK',
      rewardValue: 1,
      packTypeId: bronzePackType.id,
      description: '1x Pack Bronze - Dia 7 do ciclo (Domingo)'
    }
  ]

  console.log('🗑️ Removendo recompensas antigas...')
  await prisma.dailyReward.deleteMany({})

  console.log('✨ Criando recompensas corretas...')
  for (const reward of correctRewards) {
    await prisma.dailyReward.create({
      data: reward
    })
    
    const rewardIcon = reward.rewardType === 'CREDITS' ? '💰' : '📦'
    const rewardText = reward.rewardType === 'CREDITS' ? 
      `${reward.rewardValue} créditos` : 
      `${reward.rewardValue}x Pack Bronze`
    
    console.log(`   Dia ${reward.day}: ${rewardIcon} ${rewardText}`)
  }

  console.log('')
  console.log('✅ Recompensas diárias corrigidas!')
  console.log('📊 Novo padrão:')
  console.log('   💰 Dia 1: 10 créditos')
  console.log('   💰 Dia 2: 15 créditos') 
  console.log('   📦 Dia 3: 1x Pack Bronze')
  console.log('   💰 Dia 4: 25 créditos')
  console.log('   📦 Dia 5: 1x Pack Bronze')
  console.log('   💰 Dia 6: 50 créditos')
  console.log('   📦 Dia 7: 1x Pack Bronze')
}

fixDailyRewards()
  .catch((e) => {
    console.error('❌ Erro ao corrigir recompensas:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })