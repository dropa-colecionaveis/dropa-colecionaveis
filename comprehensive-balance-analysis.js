const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function comprehensiveBalanceAnalysis() {
  console.log('🎯 ANÁLISE ABRANGENTE: Balanceamento de Valores vs Sistema Completo\n')
  
  // 1. Buscar dados do sistema
  console.log('📊 COLETANDO DADOS DO SISTEMA...\n')
  
  // Pacotes de créditos
  const creditPackages = await prisma.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  })
  
  // Pacotes (tipos de packs)
  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    include: {
      probabilities: true,
      customType: true
    }
  })
  
  // Itens Genesis
  const genesis = await prisma.collection.findFirst({
    where: { name: 'Genesis - Primeira Era' }
  })
  
  const items = await prisma.item.findMany({
    where: { collectionId: genesis.id },
    select: {
      name: true,
      rarity: true,
      scarcityLevel: true,
      value: true,
      isUnique: true,
      isLimitedEdition: true
    },
    orderBy: [{ rarity: 'asc' }, { value: 'asc' }]
  })
  
  console.log('💰 PACOTES DE CRÉDITOS DISPONÍVEIS:')
  creditPackages.forEach(pkg => {
    const efficiency = (pkg.credits / pkg.price).toFixed(1)
    const popular = pkg.isPopular ? ' ⭐' : ''
    console.log(`   R$ ${pkg.price.toFixed(2)} → ${pkg.credits} créditos (${efficiency} créditos/real)${popular}`)
  })
  console.log('')
  
  console.log('📦 TIPOS DE PACOTES E PROBABILIDADES:')
  packs.forEach(pack => {
    console.log(`   ${pack.customType?.emoji || '📦'} ${pack.name}: ${pack.price} créditos`)
    pack.probabilities.forEach(prob => {
      console.log(`      ${getRarityEmoji(prob.rarity)} ${prob.rarity}: ${prob.percentage}%`)
    })
    console.log('')
  })
  
  // 2. Análise de probabilidades vs valores
  console.log('🎲 ANÁLISE: Probabilidade vs Valor dos Itens\n')
  
  // Calcular valores médios por raridade
  const rarityStats = {}
  items.forEach(item => {
    if (!rarityStats[item.rarity]) {
      rarityStats[item.rarity] = {
        count: 0,
        values: [],
        scarcities: {}
      }
    }
    rarityStats[item.rarity].count++
    rarityStats[item.rarity].values.push(item.value)
    
    if (!rarityStats[item.rarity].scarcities[item.scarcityLevel]) {
      rarityStats[item.rarity].scarcities[item.scarcityLevel] = 0
    }
    rarityStats[item.rarity].scarcities[item.scarcityLevel]++
  })
  
  // Para cada pack, calcular valor esperado
  console.log('💡 VALOR ESPERADO POR TIPO DE PACK:\n')
  
  for (const pack of packs) {
    console.log(`📦 ${pack.name} (${pack.price} créditos):`)
    
    let expectedValue = 0
    let analysis = []
    
    pack.probabilities.forEach(prob => {
      const rarityData = rarityStats[prob.rarity]
      if (rarityData) {
        const avgValue = rarityData.values.reduce((a, b) => a + b, 0) / rarityData.values.length
        const contribution = (prob.percentage / 100) * avgValue
        expectedValue += contribution
        
        analysis.push({
          rarity: prob.rarity,
          probability: prob.percentage,
          avgValue: Math.round(avgValue),
          contribution: Math.round(contribution),
          minValue: Math.min(...rarityData.values),
          maxValue: Math.max(...rarityData.values)
        })
      }
    })
    
    console.log(`   💰 Valor esperado: ${Math.round(expectedValue)} créditos`)
    console.log(`   📊 ROI: ${((expectedValue / pack.price) * 100).toFixed(1)}%`)
    console.log('')
    
    analysis.forEach(item => {
      console.log(`      ${getRarityEmoji(item.rarity)} ${item.rarity}: ${item.probability}%`)
      console.log(`         Valor médio: ${item.avgValue} créditos (${item.minValue}-${item.maxValue})`)
      console.log(`         Contribuição: ${item.contribution} créditos`)
      console.log('')
    })
    
    // Análise de lucratividade
    const profitability = expectedValue - pack.price
    const profitabilityPercent = ((profitability / pack.price) * 100).toFixed(1)
    
    if (profitability > 0) {
      console.log(`   ✅ Pack lucrativo: +${profitability} créditos (${profitabilityPercent}%)`)
    } else {
      console.log(`   ⚠️  Pack com perda: ${profitability} créditos (${profitabilityPercent}%)`)
    }
    console.log('')
  }
  
  // 3. Análise de acessibilidade vs pacotes de créditos
  console.log('🎯 ACESSIBILIDADE: Pacotes de Créditos vs Preços dos Itens\n')
  
  // Para cada pacote de créditos, ver que itens pode comprar
  creditPackages.forEach(pkg => {
    console.log(`💳 R$ ${pkg.price.toFixed(2)} (${pkg.credits} créditos):`)
    
    // Quantos packs cada tipo pode comprar
    packs.forEach(pack => {
      const packsAffordable = Math.floor(pkg.credits / pack.price)
      if (packsAffordable > 0) {
        console.log(`   📦 ${pack.name}: ${packsAffordable} packs (${packsAffordable * pack.price} créditos)`)
      }
    })
    
    // Que raridades pode conseguir diretamente
    const affordableItems = {}
    items.forEach(item => {
      if (item.value <= pkg.credits) {
        if (!affordableItems[item.rarity]) {
          affordableItems[item.rarity] = 0
        }
        affordableItems[item.rarity]++
      }
    })
    
    console.log('   🎁 Itens acessíveis diretamente no marketplace:')
    Object.entries(affordableItems).forEach(([rarity, count]) => {
      const total = rarityStats[rarity].count
      const percentage = ((count / total) * 100).toFixed(1)
      console.log(`      ${getRarityEmoji(rarity)} ${rarity}: ${count}/${total} (${percentage}%)`)
    })
    console.log('')
  })
  
  // 4. Recomendações de balanceamento
  console.log('🔧 ANÁLISE DE PROBLEMAS E RECOMENDAÇÕES:\n')
  
  const problems = []
  const recommendations = []
  
  // Verificar se algum pack é muito lucrativo
  for (const pack of packs) {
    let expectedValue = 0
    pack.probabilities.forEach(prob => {
      const rarityData = rarityStats[prob.rarity]
      if (rarityData) {
        const avgValue = rarityData.values.reduce((a, b) => a + b, 0) / rarityData.values.length
        expectedValue += (prob.percentage / 100) * avgValue
      }
    })
    
    const roi = ((expectedValue / pack.price) * 100)
    
    if (roi > 120) {
      problems.push(`${pack.name}: ROI muito alto (${roi.toFixed(1)}%) - pack muito lucrativo`)
      recommendations.push(`Reduzir probabilidades de itens raros no ${pack.name} ou aumentar preço`)
    } else if (roi < 80) {
      problems.push(`${pack.name}: ROI muito baixo (${roi.toFixed(1)}%) - pack pouco atrativo`)
      recommendations.push(`Aumentar probabilidades de itens raros no ${pack.name} ou reduzir preço`)
    }
  }
  
  // Verificar gaps entre pacotes de créditos
  for (let i = 0; i < creditPackages.length - 1; i++) {
    const current = creditPackages[i]
    const next = creditPackages[i + 1]
    
    const currentEfficiency = current.credits / current.price
    const nextEfficiency = next.credits / next.price
    
    const efficiencyGain = ((nextEfficiency / currentEfficiency - 1) * 100)
    
    if (efficiencyGain > 50) {
      problems.push(`Gap muito grande entre R$ ${current.price} e R$ ${next.price} (${efficiencyGain.toFixed(1)}% mais eficiente)`)
      recommendations.push(`Adicionar pacote intermediário entre R$ ${current.price} e R$ ${next.price}`)
    }
  }
  
  // Verificar itens inacessíveis
  const maxCreditsPackage = Math.max(...creditPackages.map(p => p.credits))
  const inaccessibleItems = items.filter(item => item.value > maxCreditsPackage)
  
  if (inaccessibleItems.length > 0) {
    problems.push(`${inaccessibleItems.length} itens custam mais que o maior pacote de créditos`)
    recommendations.push('Considerar pacote de créditos maior ou reduzir valores dos itens mais caros')
  }
  
  if (problems.length > 0) {
    console.log('⚠️  PROBLEMAS IDENTIFICADOS:')
    problems.forEach((problem, i) => {
      console.log(`   ${i + 1}. ${problem}`)
    })
    console.log('')
  } else {
    console.log('✅ Nenhum problema crítico detectado!')
    console.log('')
  }
  
  if (recommendations.length > 0) {
    console.log('💡 RECOMENDAÇÕES:')
    recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`)
    })
    console.log('')
  }
  
  // 5. Estatísticas finais
  console.log('📈 ESTATÍSTICAS FINAIS:')
  console.log('')
  
  // ROI médio dos packs
  let totalROI = 0
  let packCount = 0
  
  for (const pack of packs) {
    let expectedValue = 0
    pack.probabilities.forEach(prob => {
      const rarityData = rarityStats[prob.rarity]
      if (rarityData) {
        const avgValue = rarityData.values.reduce((a, b) => a + b, 0) / rarityData.values.length
        expectedValue += (prob.percentage / 100) * avgValue
      }
    })
    
    const roi = (expectedValue / pack.price) * 100
    totalROI += roi
    packCount++
  }
  
  const avgROI = totalROI / packCount
  console.log(`   🎲 ROI médio dos packs: ${avgROI.toFixed(1)}%`)
  
  // Eficiência dos pacotes de créditos
  const efficiencies = creditPackages.map(pkg => pkg.credits / pkg.price)
  const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
  const maxEfficiency = Math.max(...efficiencies)
  const minEfficiency = Math.min(...efficiencies)
  
  console.log(`   💰 Eficiência créditos/real: ${minEfficiency.toFixed(1)} - ${maxEfficiency.toFixed(1)} (média: ${avgEfficiency.toFixed(1)})`)
  
  // Distribuição de valores por raridade
  console.log(`   🎯 Distribuição de valores:`)
  Object.entries(rarityStats).forEach(([rarity, data]) => {
    const min = Math.min(...data.values)
    const max = Math.max(...data.values)
    const avg = Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length)
    console.log(`      ${getRarityEmoji(rarity)} ${rarity}: ${min}-${max} créditos (média: ${avg})`)
  })
  
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

comprehensiveBalanceAnalysis().catch(console.error)