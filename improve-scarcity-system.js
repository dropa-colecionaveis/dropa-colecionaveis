const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Sistema de Melhorias - Proposta de Redistribuição Otimizada
const improvementPlan = {
  // Manter itens especiais como estão (perfeitos)
  specialItems: {
    unique: 5,     // UNIQUE - apenas para os 5 únicos
    limited: 5     // LEGENDARY - para os 5 limitados (1000 cópias)
  },
  
  // Redistribuir 100 itens normais de forma mais equilibrada
  normalItems: {
    // Nível de escassez mais estratégico
    distributions: [
      { rarity: 'COMUM', scarcity: 'COMMON', count: 15, valueRange: [8, 12] },
      { rarity: 'COMUM', scarcity: 'UNCOMMON', count: 15, valueRange: [13, 17] },
      
      { rarity: 'INCOMUM', scarcity: 'UNCOMMON', count: 10, valueRange: [18, 22] },
      { rarity: 'INCOMUM', scarcity: 'RARE', count: 15, valueRange: [23, 29] },
      
      { rarity: 'RARO', scarcity: 'RARE', count: 15, valueRange: [30, 37] },
      { rarity: 'RARO', scarcity: 'EPIC', count: 10, valueRange: [38, 45] },
      
      { rarity: 'EPICO', scarcity: 'EPIC', count: 10, valueRange: [50, 65] },
      { rarity: 'EPICO', scarcity: 'LEGENDARY', count: 10, valueRange: [66, 85] },
      
      // Remover itens lendários normais (só especiais)
    ]
  }
}

async function proposeImprovements() {
  console.log('🎯 PROPOSTA DE MELHORIAS NO SISTEMA DE ESCASSEZ\n')
  
  // Buscar dados atuais
  const genesis = await prisma.collection.findFirst({
    where: { name: 'Genesis - Primeira Era' }
  })
  
  const currentItems = await prisma.item.findMany({
    where: { collectionId: genesis.id },
    select: {
      id: true,
      name: true,
      rarity: true,
      scarcityLevel: true,
      value: true,
      isUnique: true,
      isLimitedEdition: true,
      itemNumber: true
    },
    orderBy: { itemNumber: 'asc' }
  })
  
  console.log('📋 PROPOSTA DE REDISTRIBUIÇÃO:')
  console.log('')
  
  // 1. Manter itens especiais (únicos e limitados)
  console.log('⭐ ITENS ESPECIAIS (mantidos como estão):')
  const specialItems = currentItems.filter(item => item.isUnique || item.isLimitedEdition)
  specialItems.forEach(item => {
    const type = item.isUnique ? '🌟 ÚNICO' : '🏆 LIMITADO'
    console.log(`   ${type}: ${item.name} - ${item.value} créditos (${item.scarcityLevel})`)
  })
  console.log('')
  
  // 2. Proposta para itens normais
  console.log('📦 ITENS NORMAIS - NOVA DISTRIBUIÇÃO:')
  console.log('')
  
  let totalDistributed = 0
  improvementPlan.normalItems.distributions.forEach((dist, index) => {
    console.log(`   ${index + 1}. ${dist.rarity} → ${dist.scarcity}:`)
    console.log(`      📊 Quantidade: ${dist.count} itens`)
    console.log(`      💰 Valores: ${dist.valueRange[0]}-${dist.valueRange[1]} créditos`)
    console.log(`      🎯 Objetivo: ${getDistributionObjective(dist)}`)
    console.log('')
    totalDistributed += dist.count
  })
  
  console.log(`📈 Total de itens normais redistribuídos: ${totalDistributed}/100`)
  console.log('')
  
  // 3. Comparação com sistema atual
  console.log('🔄 COMPARAÇÃO: ANTES vs DEPOIS')
  console.log('')
  
  console.log('ANTES (sistema atual):')
  console.log('   🟫 COMUM: 30 itens (COMMON: 20, RARE: 10)')
  console.log('   🟢 INCOMUM: 25 itens (UNCOMMON: 10, RARE: 15)')
  console.log('   🔵 RARO: 25 itens (LEGENDARY: 25)')
  console.log('   🟣 ÉPICO: 20 itens (MYTHIC: 20)')
  console.log('   🟡 LENDÁRIO: 10 itens (LEGENDARY: 5, UNIQUE: 5)')
  console.log('')
  
  console.log('DEPOIS (proposta otimizada):')
  console.log('   🟫 COMUM: 30 itens (COMMON: 15, UNCOMMON: 15)')
  console.log('   🟢 INCOMUM: 25 itens (UNCOMMON: 10, RARE: 15)')
  console.log('   🔵 RARO: 25 itens (RARE: 15, EPIC: 10)')
  console.log('   🟣 ÉPICO: 20 itens (EPIC: 10, LEGENDARY: 10)')
  console.log('   🟡 LENDÁRIO: 10 itens (LEGENDARY: 5 limitados, UNIQUE: 5 únicos)')
  console.log('')
  
  // 4. Benefícios da mudança
  console.log('✅ BENEFÍCIOS DA NOVA DISTRIBUIÇÃO:')
  console.log('')
  console.log('   1. 🎯 PROGRESSÃO MAIS NATURAL:')
  console.log('      • Cada raridade usa escassez apropriada ao seu nível')
  console.log('      • Sem saltos abruptos entre níveis')
  console.log('')
  console.log('   2. 🔧 RESOLVE PROBLEMAS ATUAIS:')
  console.log('      • Elimina sobreposição de valores INCOMUM/RARO')
  console.log('      • RARO não usa mais LEGENDARY (reservado para épicos)')
  console.log('')
  console.log('   3. 💎 ESCASSEZ MAIS SIGNIFICATIVA:')
  console.log('      • COMMON: 15 itens (mais comum que atual)')
  console.log('      • UNCOMMON: 25 itens (distribuição equilibrada)')
  console.log('      • RARE: 30 itens (verdadeiramente raro)')
  console.log('      • EPIC: 20 itens (mantém raridade épica)')
  console.log('      • LEGENDARY: 15 itens (só para os melhores)')
  console.log('      • MYTHIC: 0 itens (removido da distribuição normal)')
  console.log('      • UNIQUE: 5 itens (exclusividade absoluta)')
  console.log('')
  console.log('   4. 🎮 EXPERIÊNCIA DE USUÁRIO:')
  console.log('      • Jogadores entendem melhor a hierarquia')
  console.log('      • Cada nível de escassez tem significado real')
  console.log('      • Progressão recompensante e lógica')
  console.log('')
  
  // 5. Valores rebalanceados
  console.log('💰 VALORES REBALANCEADOS (sugestão):')
  console.log('   🟫 COMUM: 8-17 créditos (atual: 8-15) ✅')
  console.log('   🟢 INCOMUM: 18-29 créditos (atual: 18-47) 🔧')
  console.log('   🔵 RARO: 30-45 créditos (atual: 30-45) ✅')
  console.log('   🟣 ÉPICO: 50-85 créditos (atual: 50-79) 🔧')
  console.log('   🟡 LENDÁRIO: 180-500 créditos (atual: 180-500) ✅')
  console.log('')
  
  await prisma.$disconnect()
}

function getDistributionObjective(dist) {
  const objectives = {
    'COMUM_COMMON': 'Itens de entrada, muito acessíveis',
    'COMUM_UNCOMMON': 'Comuns com pequeno valor extra',
    'INCOMUM_UNCOMMON': 'Verdadeiros incomuns, levemente raros',
    'INCOMUM_RARE': 'Incomuns valiosos, transição para raros',
    'RARO_RARE': 'Raros clássicos, colecionáveis',
    'RARO_EPIC': 'Raros excepcionais, quase épicos',
    'EPICO_EPIC': 'Épicos padrão, muito desejados',
    'EPICO_LEGENDARY': 'Épicos lendários, extremamente valiosos'
  }
  
  const key = `${dist.rarity}_${dist.scarcity}`
  return objectives[key] || 'Distribuição especial'
}

proposeImprovements().catch(console.error)