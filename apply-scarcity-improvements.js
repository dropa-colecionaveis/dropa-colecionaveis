const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function applyScarcityImprovements() {
  console.log('🔄 APLICANDO MELHORIAS NO SISTEMA DE ESCASSEZ...\n')
  
  // Buscar coleção Genesis
  const genesis = await prisma.collection.findFirst({
    where: { name: 'Genesis - Primeira Era' }
  })
  
  if (!genesis) {
    console.log('❌ Coleção Genesis não encontrada!')
    return
  }
  
  // Buscar todos os itens Genesis
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
      itemNumber: true
    },
    orderBy: [
      { rarity: 'asc' },
      { scarcityLevel: 'asc' },
      { itemNumber: 'asc' }
    ]
  })
  
  console.log(`📊 Processando ${items.length} itens da coleção Genesis...\n`)
  
  // Filtrar itens especiais (únicos e limitados) - manter como estão
  const specialItems = items.filter(item => item.isUnique || item.isLimitedEdition)
  const normalItems = items.filter(item => !item.isUnique && !item.isLimitedEdition)
  
  console.log(`⭐ ${specialItems.length} itens especiais mantidos`)
  console.log(`📦 ${normalItems.length} itens normais sendo redistribuídos\n`)
  
  // Plano de redistribuição otimizada
  const redistributionPlan = [
    // COMUM: 30 itens total
    { rarity: 'COMUM', scarcity: 'COMMON', count: 15, valueRange: [8, 12] },
    { rarity: 'COMUM', scarcity: 'UNCOMMON', count: 15, valueRange: [13, 17] },
    
    // INCOMUM: 25 itens total
    { rarity: 'INCOMUM', scarcity: 'UNCOMMON', count: 10, valueRange: [18, 22] },
    { rarity: 'INCOMUM', scarcity: 'RARE', count: 15, valueRange: [23, 29] },
    
    // RARO: 25 itens total
    { rarity: 'RARO', scarcity: 'RARE', count: 15, valueRange: [30, 37] },
    { rarity: 'RARO', scarcity: 'EPIC', count: 10, valueRange: [38, 45] },
    
    // ÉPICO: 20 itens total
    { rarity: 'EPICO', scarcity: 'EPIC', count: 10, valueRange: [50, 65] },
    { rarity: 'EPICO', scarcity: 'LEGENDARY', count: 10, valueRange: [66, 85] }
  ]
  
  // Agrupar itens normais por raridade
  const itemsByRarity = {
    COMUM: normalItems.filter(item => item.rarity === 'COMUM'),
    INCOMUM: normalItems.filter(item => item.rarity === 'INCOMUM'), 
    RARO: normalItems.filter(item => item.rarity === 'RARO'),
    EPICO: normalItems.filter(item => item.rarity === 'EPICO')
  }
  
  console.log('🔧 APLICANDO REDISTRIBUIÇÃO:\n')
  
  let itemIndex = 0
  let updatesCount = 0
  
  for (const plan of redistributionPlan) {
    const targetItems = itemsByRarity[plan.rarity]
    
    if (!targetItems || targetItems.length === 0) {
      console.log(`⚠️  Nenhum item ${plan.rarity} encontrado para processar`)
      continue
    }
    
    console.log(`📋 ${plan.rarity} → ${plan.scarcity} (${plan.count} itens):`)
    
    for (let i = 0; i < plan.count && itemIndex < targetItems.length; i++) {
      const item = targetItems[itemIndex]
      
      // Calcular novo valor dentro da faixa
      const valueRange = plan.valueRange[1] - plan.valueRange[0]
      const step = valueRange / (plan.count - 1)
      const newValue = Math.round(plan.valueRange[0] + (step * i))
      
      // Atualizar item no banco
      await prisma.item.update({
        where: { id: item.id },
        data: {
          scarcityLevel: plan.scarcity,
          value: newValue
        }
      })
      
      console.log(`   ✅ ${item.name}`)
      console.log(`      Escassez: ${item.scarcityLevel} → ${plan.scarcity}`)
      console.log(`      Valor: ${item.value} → ${newValue} créditos`)
      console.log('')
      
      updatesCount++
      itemIndex++
    }
    
    // Reset index para próxima raridade
    if (plan.rarity !== redistributionPlan[redistributionPlan.findIndex(p => p === plan) + 1]?.rarity) {
      itemIndex = 0
    }
  }
  
  // Verificar se alguns itens INCOMUM ou ÉPICO com valores altos precisam de ajuste
  console.log('🔧 AJUSTANDO VALORES PROBLEMÁTICOS:\n')
  
  // Buscar itens atualizados para verificação final
  const updatedItems = await prisma.item.findMany({
    where: { 
      collectionId: genesis.id,
      isUnique: false,
      isLimitedEdition: false
    },
    select: {
      id: true,
      name: true,
      rarity: true,
      scarcityLevel: true,
      value: true
    },
    orderBy: [{ rarity: 'asc' }, { value: 'asc' }]
  })
  
  // Encontrar e corrigir valores que ainda causam sobreposição
  const incomumItems = updatedItems.filter(item => item.rarity === 'INCOMUM')
  const raroItems = updatedItems.filter(item => item.rarity === 'RARO')
  
  if (incomumItems.length > 0 && raroItems.length > 0) {
    const maxIncomum = Math.max(...incomumItems.map(item => item.value))
    const minRaro = Math.min(...raroItems.map(item => item.value))
    
    if (maxIncomum >= minRaro) {
      console.log(`⚠️  Ainda há sobreposição: INCOMUM máx (${maxIncomum}) ≥ RARO mín (${minRaro})`)
      
      // Ajustar itens INCOMUM que estão acima de 29
      const problemItems = incomumItems.filter(item => item.value > 29)
      
      for (const item of problemItems) {
        const newValue = 29 - (problemItems.indexOf(item))
        
        await prisma.item.update({
          where: { id: item.id },
          data: { value: newValue }
        })
        
        console.log(`   🔧 ${item.name}: ${item.value} → ${newValue} créditos`)
        updatesCount++
      }
    } else {
      console.log('✅ Sobreposição de valores corrigida!')
    }
  }
  
  console.log('\n📈 RESUMO DAS ALTERAÇÕES:')
  console.log(`   🔄 Total de itens atualizados: ${updatesCount}`)
  console.log(`   ⭐ Itens especiais mantidos: ${specialItems.length}`)
  console.log('')
  
  // Verificação final
  console.log('🔍 VERIFICAÇÃO FINAL:\n')
  
  const finalItems = await prisma.item.findMany({
    where: { collectionId: genesis.id },
    select: {
      rarity: true,
      scarcityLevel: true,
      value: true,
      isUnique: true,
      isLimitedEdition: true
    }
  })
  
  // Estatísticas finais por raridade
  const finalStats = {}
  finalItems.forEach(item => {
    if (!finalStats[item.rarity]) {
      finalStats[item.rarity] = {
        count: 0,
        values: [],
        scarcityTypes: {}
      }
    }
    
    finalStats[item.rarity].count++
    finalStats[item.rarity].values.push(item.value)
    
    if (!finalStats[item.rarity].scarcityTypes[item.scarcityLevel]) {
      finalStats[item.rarity].scarcityTypes[item.scarcityLevel] = 0
    }
    finalStats[item.rarity].scarcityTypes[item.scarcityLevel]++
  })
  
  Object.entries(finalStats).forEach(([rarity, stats]) => {
    const minValue = Math.min(...stats.values)
    const maxValue = Math.max(...stats.values)
    const avgValue = Math.round(stats.values.reduce((a, b) => a + b, 0) / stats.values.length)
    
    console.log(`${getRarityEmoji(rarity)} ${rarity}:`)
    console.log(`   📊 ${stats.count} itens | 💰 ${minValue}-${maxValue} créditos (média: ${avgValue})`)
    console.log(`   🎯 Escassez: ${Object.entries(stats.scarcityTypes).map(([level, count]) => `${level}(${count})`).join(', ')}`)
    console.log('')
  })
  
  console.log('✅ OTIMIZAÇÃO DO SISTEMA DE ESCASSEZ CONCLUÍDA!')
  console.log('🎯 Benefícios aplicados:')
  console.log('   • Progressão natural entre raridades')
  console.log('   • Eliminação de sobreposições de valores')
  console.log('   • Escassez mais significativa e clara')
  console.log('   • Experiência de usuário aprimorada')
  
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

applyScarcityImprovements().catch(console.error)