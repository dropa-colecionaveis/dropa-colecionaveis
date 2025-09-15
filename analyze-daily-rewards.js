const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeDailyRewards() {
  console.log('🎁 ANÁLISE DETALHADA: Sistema de Recompensas Diárias\n')
  
  // Dados das recompensas da imagem
  const currentDailyRewards = [
    { day: 1, type: 'CREDITS', value: 10, description: '10 créditos' },
    { day: 2, type: 'CREDITS', value: 15, description: '15 créditos', highlight: 'HOJE' },
    { day: 3, type: 'PACK', value: 1, packType: 'Bronze', description: '1x Pack Bronze' },
    { day: 4, type: 'CREDITS', value: 25, description: '25 créditos' },
    { day: 5, type: 'PACK', value: 1, packType: 'Prata', description: '1x Pack Prata' },
    { day: 6, type: 'CREDITS', value: 50, description: '50 créditos' },
    { day: 7, type: 'PACK', value: 1, packType: 'Ouro', description: '1x Pack Ouro' }
  ]
  
  // Multiplicadores de streak
  const streakBonuses = [
    { days: 8, bonus: 10, description: '8+ dias (+10%)' },
    { days: 15, bonus: 20, description: '15+ dias (+20%)' },
    { days: 31, bonus: 30, description: '31+ dias (+30%)' }
  ]
  
  // Preços dos packs e pacotes de créditos
  const packPrices = {
    'Bronze': 25,
    'Prata': 35,
    'Ouro': 45,
    'Platina': 75,
    'Diamante': 95
  }
  
  const creditPackages = [
    { price: 2.00, credits: 30 },
    { price: 5.00, credits: 85 },
    { price: 10.00, credits: 200 },
    { price: 20.00, credits: 450 },
    { price: 35.00, credits: 800 },
    { price: 60.00, credits: 1400 },
    { price: 100.00, credits: 2400 }
  ]
  
  console.log('📅 RECOMPENSAS DIÁRIAS ATUAIS (da imagem):\n')
  
  let totalCreditsWeek = 0
  let totalPacksValue = 0
  
  currentDailyRewards.forEach(reward => {
    const highlight = reward.highlight ? ` [${reward.highlight}]` : ''
    
    if (reward.type === 'CREDITS') {
      totalCreditsWeek += reward.value
      console.log(`   Dia ${reward.day}: 💰 ${reward.value} créditos${highlight}`)
    } else {
      const packValue = packPrices[reward.packType]
      totalPacksValue += packValue
      console.log(`   Dia ${reward.day}: 📦 ${reward.description} (${packValue} créditos)${highlight}`)
    }
  })
  
  const totalWeekValue = totalCreditsWeek + totalPacksValue
  console.log(`\n📊 VALOR TOTAL SEMANAL: ${totalWeekValue} créditos`)
  console.log(`   💰 Créditos diretos: ${totalCreditsWeek}`)
  console.log(`   📦 Valor em packs: ${totalPacksValue}`)
  console.log('')
  
  console.log('⚡ MULTIPLICADORES DE STREAK:\n')
  streakBonuses.forEach(bonus => {
    console.log(`   🔥 ${bonus.description}`)
  })
  console.log('')
  
  // Análise de valor vs pacotes de créditos
  console.log('💰 COMPARAÇÃO COM PACOTES DE CRÉDITOS:\n')
  
  const weekValueInReais = []
  creditPackages.forEach(pkg => {
    const efficiency = pkg.credits / pkg.price
    const valueInReais = totalWeekValue / efficiency
    weekValueInReais.push(valueInReais)
    console.log(`   R$ ${pkg.price.toFixed(2)} pacote: Semana vale R$ ${valueInReais.toFixed(2)}`)
  })
  
  const avgValueInReais = weekValueInReais.reduce((a, b) => a + b, 0) / weekValueInReais.length
  console.log(`   📈 Valor médio semanal: R$ ${avgValueInReais.toFixed(2)}`)
  console.log('')
  
  // Análise com multiplicadores
  console.log('🔥 IMPACTO DOS MULTIPLICADORES DE STREAK:\n')
  
  streakBonuses.forEach(bonus => {
    const bonusValue = totalWeekValue * (bonus.bonus / 100)
    const totalWithBonus = totalWeekValue + bonusValue
    const valueInReais = totalWithBonus / 20.0 // Usando eficiência do pacote R$ 10
    
    console.log(`   ${bonus.description}:`)
    console.log(`      💰 Valor base: ${totalWeekValue} créditos`)
    console.log(`      ⚡ Bônus: +${bonusValue.toFixed(0)} créditos`)
    console.log(`      📊 Total: ${totalWithBonus.toFixed(0)} créditos`)
    console.log(`      💸 Valor real: R$ ${valueInReais.toFixed(2)}`)
    console.log('')
  })
  
  // Análise de sustentabilidade
  console.log('⚖️  ANÁLISE DE SUSTENTABILIDADE:\n')
  
  const problems = []
  const recommendations = []
  
  // Verificar se as recompensas são muito generosas
  if (totalWeekValue > 150) {
    problems.push(`Valor semanal muito alto (${totalWeekValue} créditos)`)
    recommendations.push('Considerar reduzir algumas recompensas')
  }
  
  // Verificar se as recompensas são muito baixas
  if (totalWeekValue < 80) {
    problems.push(`Valor semanal muito baixo (${totalWeekValue} créditos)`)
    recommendations.push('Considerar aumentar algumas recompensas')
  }
  
  // Verificar multiplicadores
  const maxBonusValue = totalWeekValue * 0.3 // 30% bonus
  if (maxBonusValue > 50) {
    problems.push(`Bônus de 30% muito alto (+${maxBonusValue.toFixed(0)} créditos)`)
    recommendations.push('Considerar reduzir multiplicador para 25%')
  }
  
  // Verificar progressão das recompensas
  const creditRewards = currentDailyRewards.filter(r => r.type === 'CREDITS').map(r => r.value)
  const isProgressive = creditRewards.every((val, i) => i === 0 || val >= creditRewards[i-1])
  
  if (!isProgressive) {
    problems.push('Recompensas de créditos não são progressivas')
    recommendations.push('Ajustar para progressão crescente: 10 → 15 → 25 → 50')
  }
  
  // Verificar equilíbrio dos packs
  const packDays = currentDailyRewards.filter(r => r.type === 'PACK')
  const hasGoodProgression = packDays.length === 3 && 
    packDays[0].packType === 'Bronze' && 
    packDays[1].packType === 'Prata' && 
    packDays[2].packType === 'Ouro'
  
  if (!hasGoodProgression) {
    problems.push('Progressão de packs não ideal')
    recommendations.push('Manter Bronze → Prata → Ouro')
  }
  
  console.log('🚨 PROBLEMAS IDENTIFICADOS:')
  if (problems.length > 0) {
    problems.forEach((problem, i) => {
      console.log(`   ${i + 1}. ${problem}`)
    })
  } else {
    console.log('   ✅ Sistema bem equilibrado!')
  }
  console.log('')
  
  console.log('💡 RECOMENDAÇÕES:')
  if (recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`)
    })
  } else {
    console.log('   ✅ Sistema atual é adequado!')
  }
  console.log('')
  
  // Proposta de sistema otimizado
  console.log('🎯 PROPOSTA DE SISTEMA OTIMIZADO:\n')
  
  const optimizedRewards = [
    { day: 1, type: 'CREDITS', value: 8, description: '8 créditos' },
    { day: 2, type: 'CREDITS', value: 12, description: '12 créditos' },
    { day: 3, type: 'PACK', value: 1, packType: 'Bronze', description: '1x Pack Bronze (25 créditos)' },
    { day: 4, type: 'CREDITS', value: 20, description: '20 créditos' },
    { day: 5, type: 'PACK', value: 1, packType: 'Prata', description: '1x Pack Prata (35 créditos)' },
    { day: 6, type: 'CREDITS', value: 30, description: '30 créditos' },
    { day: 7, type: 'PACK', value: 1, packType: 'Ouro', description: '1x Pack Ouro (45 créditos)' }
  ]
  
  const optimizedStreaks = [
    { days: 8, bonus: 8, description: '8+ dias (+8%)' },
    { days: 15, bonus: 15, description: '15+ dias (+15%)' },
    { days: 30, bonus: 25, description: '30+ dias (+25%)' }
  ]
  
  console.log('📅 RECOMPENSAS OTIMIZADAS:')
  let optTotalCredits = 0
  let optTotalPacks = 0
  
  optimizedRewards.forEach(reward => {
    if (reward.type === 'CREDITS') {
      optTotalCredits += reward.value
      console.log(`   Dia ${reward.day}: 💰 ${reward.description}`)
    } else {
      const packValue = packPrices[reward.packType]
      optTotalPacks += packValue
      console.log(`   Dia ${reward.day}: 📦 ${reward.description}`)
    }
  })
  
  const optTotalWeek = optTotalCredits + optTotalPacks
  console.log(`\n📊 VALOR TOTAL OTIMIZADO: ${optTotalWeek} créditos`)
  console.log(`   💰 Créditos diretos: ${optTotalCredits}`)
  console.log(`   📦 Valor em packs: ${optTotalPacks}`)
  console.log('')
  
  console.log('⚡ MULTIPLICADORES OTIMIZADOS:')
  optimizedStreaks.forEach(bonus => {
    const bonusValue = optTotalWeek * (bonus.bonus / 100)
    const totalWithBonus = optTotalWeek + bonusValue
    console.log(`   🔥 ${bonus.description} = ${totalWithBonus.toFixed(0)} créditos totais`)
  })
  console.log('')
  
  // Comparação final
  console.log('📈 COMPARAÇÃO: ATUAL vs OTIMIZADO\n')
  
  console.log('SISTEMA ATUAL:')
  console.log(`   📊 Valor semanal: ${totalWeekValue} créditos`)
  console.log(`   💸 Valor em reais: R$ ${(totalWeekValue/20).toFixed(2)}`)
  console.log(`   ⚡ Com 30% bonus: ${(totalWeekValue * 1.3).toFixed(0)} créditos`)
  console.log('')
  
  console.log('SISTEMA OTIMIZADO:')
  console.log(`   📊 Valor semanal: ${optTotalWeek} créditos`)
  console.log(`   💸 Valor em reais: R$ ${(optTotalWeek/20).toFixed(2)}`)
  console.log(`   ⚡ Com 25% bonus: ${(optTotalWeek * 1.25).toFixed(0)} créditos`)
  console.log('')
  
  console.log('🏆 CONCLUSÃO:')
  if (totalWeekValue === optTotalWeek) {
    console.log('   ✅ Sistema atual já está bem balanceado!')
    console.log('   💡 Considere apenas ajustar multiplicadores para 8%, 15%, 25%')
  } else if (optTotalWeek < totalWeekValue) {
    console.log('   ⚠️  Sistema atual pode ser muito generoso')
    console.log('   💡 Considere a versão otimizada para sustentabilidade')
  } else {
    console.log('   📈 Sistema atual pode ser pouco atrativo')
    console.log('   💡 Considere aumentar algumas recompensas')
  }
  
  await prisma.$disconnect()
}

analyzeDailyRewards().catch(console.error)