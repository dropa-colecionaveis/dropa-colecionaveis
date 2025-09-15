const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function reimplementMythic() {
  console.log('🔮 REIMPLEMENTANDO MYTHIC PARA ITENS LIMITADOS...\n')
  
  // Buscar coleção Genesis
  const genesis = await prisma.collection.findFirst({
    where: { name: 'Genesis - Primeira Era' }
  })
  
  if (!genesis) {
    console.log('❌ Coleção Genesis não encontrada!')
    return
  }
  
  // Buscar todos os itens lendários
  const legendaryItems = await prisma.item.findMany({
    where: { 
      collectionId: genesis.id,
      rarity: 'LENDARIO'
    },
    select: {
      id: true,
      name: true,
      rarity: true,
      scarcityLevel: true,
      value: true,
      isUnique: true,
      isLimitedEdition: true,
      maxEditions: true,
      itemNumber: true
    },
    orderBy: { itemNumber: 'asc' }
  })
  
  console.log(`📊 Encontrados ${legendaryItems.length} itens LENDÁRIOS`)
  console.log('')
  
  // Separar por tipo
  const uniqueItems = legendaryItems.filter(item => item.isUnique)
  const limitedItems = legendaryItems.filter(item => item.isLimitedEdition)
  
  console.log(`🌟 Itens únicos (1 cópia): ${uniqueItems.length}`)
  console.log(`🏆 Itens limitados (1000 cópias): ${limitedItems.length}`)
  console.log('')
  
  // Nova distribuição LENDÁRIO:
  console.log('🎯 NOVA HIERARQUIA LENDÁRIA:')
  console.log('   🌟 UNIQUE: Itens únicos (1 cópia mundial)')
  console.log('   🔮 MYTHIC: Itens limitados (1000 cópias)')
  console.log('   👑 LEGENDARY: Épicos especiais')
  console.log('')
  
  console.log('🔄 APLICANDO MUDANÇAS:\n')
  
  // 1. Atualizar itens limitados para MYTHIC
  console.log('🔮 Convertendo itens limitados para MYTHIC:')
  let updatesCount = 0
  
  for (const item of limitedItems) {
    await prisma.item.update({
      where: { id: item.id },
      data: { scarcityLevel: 'MYTHIC' }
    })
    
    console.log(`   ✅ ${item.name}`)
    console.log(`      Escassez: ${item.scarcityLevel} → MYTHIC`)
    console.log(`      Status: ${item.maxEditions} cópias limitadas`)
    console.log('')
    
    updatesCount++
  }
  
  // 2. Manter itens únicos como UNIQUE
  console.log('🌟 Mantendo itens únicos como UNIQUE:')
  for (const item of uniqueItems) {
    console.log(`   ✅ ${item.name}`)
    console.log(`      Escassez: ${item.scarcityLevel} (mantido)`)
    console.log(`      Status: Único mundial`)
    console.log('')
  }
  
  // 3. Verificar se há épicos que devem ser promovidos para LEGENDARY
  const epicItems = await prisma.item.findMany({
    where: { 
      collectionId: genesis.id,
      rarity: 'EPICO',
      scarcityLevel: 'LEGENDARY'
    },
    select: {
      id: true,
      name: true,
      value: true
    }
  })
  
  console.log(`👑 Épicos especiais já usando LEGENDARY: ${epicItems.length}`)
  epicItems.forEach(item => {
    console.log(`   ✅ ${item.name} - ${item.value} créditos`)
  })
  console.log('')
  
  // 4. Verificação final da distribuição
  console.log('📊 VERIFICAÇÃO FINAL DA DISTRIBUIÇÃO:\n')
  
  const finalDistribution = await prisma.item.findMany({
    where: { collectionId: genesis.id },
    select: {
      rarity: true,
      scarcityLevel: true,
      isUnique: true,
      isLimitedEdition: true,
      value: true
    }
  })
  
  // Contar por escassez
  const scarcityCount = {}
  finalDistribution.forEach(item => {
    if (!scarcityCount[item.scarcityLevel]) {
      scarcityCount[item.scarcityLevel] = 0
    }
    scarcityCount[item.scarcityLevel]++
  })
  
  console.log('🎯 DISTRIBUIÇÃO FINAL POR ESCASSEZ:')
  Object.entries(scarcityCount).sort().forEach(([scarcity, count]) => {
    const emoji = getScarcityEmoji(scarcity)
    const percentage = ((count / finalDistribution.length) * 100).toFixed(1)
    console.log(`   ${emoji} ${scarcity}: ${count} itens (${percentage}%)`)
  })
  console.log('')
  
  // Análise específica dos lendários
  const legendaryAnalysis = finalDistribution.filter(item => item.rarity === 'LENDARIO')
  const legendaryByScarcity = {}
  legendaryAnalysis.forEach(item => {
    if (!legendaryByScarcity[item.scarcityLevel]) {
      legendaryByScarcity[item.scarcityLevel] = {
        count: 0,
        avgValue: 0,
        values: []
      }
    }
    legendaryByScarcity[item.scarcityLevel].count++
    legendaryByScarcity[item.scarcityLevel].values.push(item.value)
  })
  
  // Calcular médias
  Object.keys(legendaryByScarcity).forEach(scarcity => {
    const values = legendaryByScarcity[scarcity].values
    legendaryByScarcity[scarcity].avgValue = Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    )
  })
  
  console.log('🟡 ANÁLISE DETALHADA - LENDÁRIOS:')
  Object.entries(legendaryByScarcity).forEach(([scarcity, data]) => {
    const emoji = getScarcityEmoji(scarcity)
    console.log(`   ${emoji} ${scarcity}: ${data.count} itens (média: ${data.avgValue} créditos)`)
  })
  console.log('')
  
  console.log('✅ MYTHIC REIMPLEMENTADO COM SUCESSO!')
  console.log('')
  console.log('🎯 BENEFÍCIOS ALCANÇADOS:')
  console.log('   • MYTHIC agora tem propósito específico (itens limitados)')
  console.log('   • Hierarquia mais rica para lendários')
  console.log('   • Diferenciação clara entre tipos de exclusividade')
  console.log('   • Melhor experiência de marketing e colecionismo')
  console.log('')
  console.log('🚀 FUTURAS POSSIBILIDADES:')
  console.log('   • Eventos especiais com novos itens MYTHIC')
  console.log('   • Colaborações de artistas em tier MYTHIC')
  console.log('   • Temporadas limitadas com distribuição MYTHIC')
  
  console.log(`\n📈 RESUMO: ${updatesCount} itens convertidos para MYTHIC`)
  
  await prisma.$disconnect()
}

function getScarcityEmoji(scarcity) {
  const emojis = {
    'COMMON': '📦',
    'UNCOMMON': '📋',
    'RARE': '💎',
    'EPIC': '⚡',
    'LEGENDARY': '👑',
    'MYTHIC': '🔮',
    'UNIQUE': '🌟'
  }
  return emojis[scarcity] || '❓'
}

reimplementMythic().catch(console.error)