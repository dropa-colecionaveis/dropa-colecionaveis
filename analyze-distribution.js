const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeDistribution() {
  console.log('🔍 ANÁLISE DETALHADA: Sistema de Raridade e Escassez\n')
  
  // 1. Buscar coleção Genesis
  const genesis = await prisma.collection.findFirst({
    where: { name: 'Genesis - Primeira Era' }
  })
  
  if (!genesis) {
    console.log('❌ Coleção Genesis não encontrada!')
    return
  }
  
  // 2. Buscar todos os itens Genesis
  const items = await prisma.item.findMany({
    where: { collectionId: genesis.id },
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
    orderBy: [
      { rarity: 'asc' },
      { scarcityLevel: 'asc' },
      { itemNumber: 'asc' }
    ]
  })
  
  console.log(`📊 COLEÇÃO GENESIS: ${items.length} itens encontrados\n`)
  
  // 3. Análise por Raridade
  console.log('🎯 DISTRIBUIÇÃO POR RARIDADE:')
  const rarityStats = {}
  
  items.forEach(item => {
    if (!rarityStats[item.rarity]) {
      rarityStats[item.rarity] = {
        count: 0,
        values: [],
        scarcityTypes: {},
        specialTypes: { unique: 0, limited: 0, normal: 0 }
      }
    }
    
    rarityStats[item.rarity].count++
    rarityStats[item.rarity].values.push(item.value)
    
    // Contar tipos de escassez
    if (!rarityStats[item.rarity].scarcityTypes[item.scarcityLevel]) {
      rarityStats[item.rarity].scarcityTypes[item.scarcityLevel] = 0
    }
    rarityStats[item.rarity].scarcityTypes[item.scarcityLevel]++
    
    // Contar tipos especiais
    if (item.isUnique) {
      rarityStats[item.rarity].specialTypes.unique++
    } else if (item.isLimitedEdition) {
      rarityStats[item.rarity].specialTypes.limited++
    } else {
      rarityStats[item.rarity].specialTypes.normal++
    }
  })
  
  Object.entries(rarityStats).forEach(([rarity, stats]) => {
    const avgValue = Math.round(stats.values.reduce((a, b) => a + b, 0) / stats.values.length)
    const minValue = Math.min(...stats.values)
    const maxValue = Math.max(...stats.values)
    
    console.log(`   ${getRarityEmoji(rarity)} ${rarity}:`)
    console.log(`      📦 Total: ${stats.count} itens`)
    console.log(`      💰 Valores: ${minValue}-${maxValue} créditos (média: ${avgValue})`)
    console.log(`      🎭 Tipos Especiais: ${stats.specialTypes.unique} únicos, ${stats.specialTypes.limited} limitados, ${stats.specialTypes.normal} normais`)
    console.log(`      📊 Escassez: ${Object.entries(stats.scarcityTypes).map(([level, count]) => `${level}(${count})`).join(', ')}`)
    console.log('')
  })
  
  // 4. Análise do Sistema de Escassez
  console.log('🔥 DISTRIBUIÇÃO POR ESCASSEZ:')
  const scarcityStats = {}
  
  items.forEach(item => {
    if (!scarcityStats[item.scarcityLevel]) {
      scarcityStats[item.scarcityLevel] = {
        count: 0,
        rarities: {},
        values: []
      }
    }
    
    scarcityStats[item.scarcityLevel].count++
    scarcityStats[item.scarcityLevel].values.push(item.value)
    
    if (!scarcityStats[item.scarcityLevel].rarities[item.rarity]) {
      scarcityStats[item.scarcityLevel].rarities[item.rarity] = 0
    }
    scarcityStats[item.scarcityLevel].rarities[item.rarity]++
  })
  
  Object.entries(scarcityStats).forEach(([scarcity, stats]) => {
    const avgValue = Math.round(stats.values.reduce((a, b) => a + b, 0) / stats.values.length)
    
    console.log(`   ${getScarcityEmoji(scarcity)} ${scarcity}:`)
    console.log(`      📦 Total: ${stats.count} itens (${((stats.count/items.length)*100).toFixed(1)}%)`)
    console.log(`      💰 Valor médio: ${avgValue} créditos`)
    console.log(`      🎨 Raridades: ${Object.entries(stats.rarities).map(([r, c]) => `${r}(${c})`).join(', ')}`)
    console.log('')
  })
  
  // 5. Itens Especiais - Análise Detalhada
  console.log('⭐ ITENS ESPECIAIS:')
  
  const uniqueItems = items.filter(item => item.isUnique)
  console.log(`   🌟 ÚNICOS (${uniqueItems.length} itens):`)
  uniqueItems.forEach(item => {
    console.log(`      #${item.itemNumber || '???'} ${item.name} - ${item.value} créditos (${item.rarity}/${item.scarcityLevel})`)
  })
  console.log('')
  
  const limitedItems = items.filter(item => item.isLimitedEdition)
  console.log(`   🏆 LIMITADOS (${limitedItems.length} itens - ${limitedItems[0]?.maxEditions || '???'} cópias cada):`)
  limitedItems.forEach(item => {
    console.log(`      #${item.itemNumber || '???'} ${item.name} - ${item.value} créditos (${item.rarity}/${item.scarcityLevel})`)
  })
  console.log('')
  
  // 6. Problemas Potenciais
  console.log('⚠️  ANÁLISE DE PROBLEMAS:')
  
  const problems = []
  
  // Verificar inconsistências de escassez vs raridade
  items.forEach(item => {
    const rarityIndex = ['COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO'].indexOf(item.rarity)
    const scarcityIndex = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'UNIQUE'].indexOf(item.scarcityLevel)
    
    // Problema: raridade baixa com escassez muito alta
    if (rarityIndex <= 1 && scarcityIndex >= 4) {
      problems.push(`${item.name}: ${item.rarity} com escassez ${item.scarcityLevel} pode ser inconsistente`)
    }
    
    // Problema: lendário sem escassez alta
    if (item.rarity === 'LENDARIO' && scarcityIndex < 4) {
      problems.push(`${item.name}: LENDÁRIO deveria ter escassez LEGENDARY+ (atual: ${item.scarcityLevel})`)
    }
  })
  
  // Verificar gaps de valor
  const rarityValues = {
    'COMUM': rarityStats['COMUM']?.values || [],
    'INCOMUM': rarityStats['INCOMUM']?.values || [],
    'RARO': rarityStats['RARO']?.values || [],
    'EPICO': rarityStats['EPICO']?.values || [],
    'LENDARIO': rarityStats['LENDARIO']?.values || []
  }
  
  const rarityOrder = ['COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO']
  for (let i = 0; i < rarityOrder.length - 1; i++) {
    const current = rarityOrder[i]
    const next = rarityOrder[i + 1]
    
    if (rarityValues[current].length && rarityValues[next].length) {
      const currentMax = Math.max(...rarityValues[current])
      const nextMin = Math.min(...rarityValues[next])
      
      if (currentMax >= nextMin) {
        problems.push(`Sobreposição de valores: ${current} máximo (${currentMax}) >= ${next} mínimo (${nextMin})`)
      }
    }
  }
  
  if (problems.length > 0) {
    problems.forEach(problem => console.log(`   ❌ ${problem}`))
  } else {
    console.log('   ✅ Nenhum problema crítico detectado!')
  }
  
  console.log('\n🎯 RECOMENDAÇÕES:')
  console.log('   1. Sistema atual tem boa base com 7 níveis de escassez')
  console.log('   2. Considerar usar MYTHIC para itens limitados (1000 cópias)')
  console.log('   3. UNIQUE exclusivo para os 5 itens únicos')
  console.log('   4. Possível redistribuição dos 100 itens normais entre COMMON, UNCOMMON, RARE, EPIC, LEGENDARY')
  console.log('   5. Valores bem balanceados, manter progressão atual')
  
  await prisma.$disconnect()
}

function getRarityEmoji(rarity) {
  const emojis = {
    'COMUM': '🟫',
    'INCOMUM': '🟢', 
    'RARO': '🔵',
    'EPICO': '🟣',
    'LENDARIO': '🟡'
  }
  return emojis[rarity] || '⚪'
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

analyzeDistribution().catch(console.error)