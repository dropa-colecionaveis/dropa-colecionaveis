const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeFreePackLottery() {
  console.log('🎰 ANÁLISE DETALHADA: Sistema de Sorteio do Pacote Gratuito\n')
  
  // Probabilidades atuais do sistema
  const currentLotterySystem = [
    { pack: 'Bronze', probability: 60.0, value: 25, realCost: 1.25 },
    { pack: 'Prata', probability: 25.0, value: 35, realCost: 1.75 },
    { pack: 'Ouro', probability: 12.0, value: 45, realCost: 2.25 },
    { pack: 'Platina', probability: 2.5, value: 75, realCost: 3.75 },
    { pack: 'Diamante', probability: 0.5, value: 95, realCost: 4.75 }
  ]
  
  console.log('🎲 SISTEMA ATUAL DE PROBABILIDADES:\n')
  currentLotterySystem.forEach(item => {
    console.log(`   ${getPackEmoji(item.pack)} ${item.pack}: ${item.probability}% (${item.value} créditos = R$ ${item.realCost})`)
  })
  
  // Verificar se soma 100%
  const totalProbability = currentLotterySystem.reduce((sum, item) => sum + item.probability, 0)
  console.log(`\n📊 Total de probabilidades: ${totalProbability}%`)
  
  if (totalProbability !== 100) {
    console.log('⚠️  ERRO: Probabilidades não somam 100%!')
  } else {
    console.log('✅ Probabilidades corretas (somam 100%)')
  }
  console.log('')
  
  // Calcular valor esperado do sistema de sorteio
  console.log('💰 CÁLCULO DO VALOR ESPERADO:\n')
  
  let expectedValue = 0
  let expectedCost = 0
  
  currentLotterySystem.forEach(item => {
    const contribution = (item.probability / 100) * item.value
    const costContribution = (item.probability / 100) * item.realCost
    
    expectedValue += contribution
    expectedCost += costContribution
    
    console.log(`   ${getPackEmoji(item.pack)} ${item.pack}: ${item.probability}% × ${item.value} = ${contribution.toFixed(1)} créditos`)
  })
  
  console.log(`\n📈 VALOR ESPERADO TOTAL: ${expectedValue.toFixed(1)} créditos`)
  console.log(`💸 CUSTO ESPERADO TOTAL: R$ ${expectedCost.toFixed(2)}`)
  console.log('')
  
  // Análise de distribuição
  console.log('📊 ANÁLISE DE DISTRIBUIÇÃO:\n')
  
  // Simular 1000 usuários
  const simulationSize = 1000
  const distribution = {}
  
  currentLotterySystem.forEach(item => {
    distribution[item.pack] = Math.round((item.probability / 100) * simulationSize)
  })
  
  console.log(`🎮 SIMULAÇÃO: ${simulationSize} novos usuários`)
  Object.entries(distribution).forEach(([pack, count]) => {
    const percentage = ((count / simulationSize) * 100).toFixed(1)
    console.log(`   ${getPackEmoji(pack)} ${pack}: ${count} usuários (${percentage}%)`)
  })
  console.log('')
  
  // Calcular custo total para a empresa
  let totalCost = 0
  Object.entries(distribution).forEach(([pack, count]) => {
    const packData = currentLotterySystem.find(p => p.pack === pack)
    const cost = count * packData.realCost
    totalCost += cost
    console.log(`   ${getPackEmoji(pack)} ${pack}: ${count} × R$ ${packData.realCost} = R$ ${cost.toFixed(2)}`)
  })
  
  console.log(`\n💰 CUSTO TOTAL PARA 1000 USUÁRIOS: R$ ${totalCost.toFixed(2)}`)
  console.log(`📊 CUSTO MÉDIO POR USUÁRIO: R$ ${(totalCost / simulationSize).toFixed(2)}`)
  console.log('')
  
  // Análise de problemas potenciais
  console.log('⚖️  ANÁLISE DE PROBLEMAS POTENCIAIS:\n')
  
  const problems = []
  const recommendations = []
  
  // Verificar se há concentração excessiva em um pack
  if (currentLotterySystem[0].probability > 70) {
    problems.push(`Concentração muito alta no ${currentLotterySystem[0].pack} (${currentLotterySystem[0].probability}%)`)
    recommendations.push('Reduzir probabilidade do Bronze para 50-55%')
  }
  
  // Verificar se packs premium são muito raros
  const premiumPacks = currentLotterySystem.filter(p => p.probability < 5)
  if (premiumPacks.length > 2) {
    problems.push(`Muitos packs premium com probabilidade muito baixa`)
    recommendations.push('Aumentar ligeiramente as chances dos packs premium')
  }
  
  // Verificar valor esperado vs custo
  if (expectedCost > 2.50) {
    problems.push(`Custo esperado muito alto (R$ ${expectedCost.toFixed(2)})`)
    recommendations.push('Reduzir probabilidades dos packs mais caros')
  }
  
  // Verificar experiência do usuário
  const bronzeChance = currentLotterySystem[0].probability
  if (bronzeChance > 65) {
    problems.push(`Chance muito alta de Bronze pode frustrar usuários`)
    recommendations.push('Balancear melhor entre Bronze e Prata')
  }
  
  console.log('🚨 PROBLEMAS IDENTIFICADOS:')
  if (problems.length > 0) {
    problems.forEach((problem, i) => {
      console.log(`   ${i + 1}. ${problem}`)
    })
  } else {
    console.log('   ✅ Nenhum problema crítico identificado!')
  }
  console.log('')
  
  console.log('💡 RECOMENDAÇÕES:')
  if (recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`)
    })
  } else {
    console.log('   ✅ Sistema atual bem balanceado!')
  }
  console.log('')
  
  // Proposta de sistema otimizado
  console.log('🎯 PROPOSTA DE SISTEMA OTIMIZADO:\n')
  
  const optimizedSystem = [
    { pack: 'Bronze', probability: 55.0, value: 25, realCost: 1.25 },
    { pack: 'Prata', probability: 30.0, value: 35, realCost: 1.75 },
    { pack: 'Ouro', probability: 12.0, value: 45, realCost: 2.25 },
    { pack: 'Platina', probability: 2.5, value: 75, realCost: 3.75 },
    { pack: 'Diamante', probability: 0.5, value: 95, realCost: 4.75 }
  ]
  
  console.log('🎲 SISTEMA OTIMIZADO:')
  optimizedSystem.forEach(item => {
    console.log(`   ${getPackEmoji(item.pack)} ${item.pack}: ${item.probability}%`)
  })
  console.log('')
  
  // Calcular valor esperado do sistema otimizado
  let optimizedExpectedValue = 0
  let optimizedExpectedCost = 0
  
  optimizedSystem.forEach(item => {
    optimizedExpectedValue += (item.probability / 100) * item.value
    optimizedExpectedCost += (item.probability / 100) * item.realCost
  })
  
  console.log('📊 COMPARAÇÃO: ATUAL vs OTIMIZADO')
  console.log('')
  console.log('SISTEMA ATUAL:')
  console.log(`   💰 Valor esperado: ${expectedValue.toFixed(1)} créditos`)
  console.log(`   💸 Custo esperado: R$ ${expectedCost.toFixed(2)}`)
  console.log(`   🥉 Bronze: ${currentLotterySystem[0].probability}%`)
  console.log(`   🥈 Prata: ${currentLotterySystem[1].probability}%`)
  console.log('')
  
  console.log('SISTEMA OTIMIZADO:')
  console.log(`   💰 Valor esperado: ${optimizedExpectedValue.toFixed(1)} créditos`)
  console.log(`   💸 Custo esperado: R$ ${optimizedExpectedCost.toFixed(2)}`)
  console.log(`   🥉 Bronze: ${optimizedSystem[0].probability}%`)
  console.log(`   🥈 Prata: ${optimizedSystem[1].probability}%`)
  console.log('')
  
  // Análise de experiência do usuário
  console.log('🎮 IMPACTO NA EXPERIÊNCIA DO USUÁRIO:\n')
  
  const experienceAnalysis = {
    current: {
      satisfaction: 'Média-Baixa',
      reason: '60% recebem Bronze (pode frustrar)',
      conversion: 'Moderada'
    },
    optimized: {
      satisfaction: 'Média-Alta', 
      reason: '45% recebem Prata ou melhor (mais satisfatório)',
      conversion: 'Alta'
    }
  }
  
  console.log('SISTEMA ATUAL:')
  console.log(`   😊 Satisfação: ${experienceAnalysis.current.satisfaction}`)
  console.log(`   💭 Motivo: ${experienceAnalysis.current.reason}`)
  console.log(`   📈 Conversão: ${experienceAnalysis.current.conversion}`)
  console.log('')
  
  console.log('SISTEMA OTIMIZADO:')
  console.log(`   😊 Satisfação: ${experienceAnalysis.optimized.satisfaction}`)
  console.log(`   💭 Motivo: ${experienceAnalysis.optimized.reason}`)
  console.log(`   📈 Conversão: ${experienceAnalysis.optimized.conversion}`)
  console.log('')
  
  console.log('🏆 CONCLUSÃO FINAL:')
  console.log('')
  
  if (optimizedExpectedCost < expectedCost && optimizedExpectedValue > expectedValue * 0.95) {
    console.log('✅ RECOMENDO O SISTEMA OTIMIZADO:')
    console.log('   • Melhor experiência do usuário')
    console.log('   • Custo similar ou menor')
    console.log('   • Maior satisfação inicial')
    console.log('   • Melhor taxa de conversão esperada')
  } else if (expectedCost <= 2.00) {
    console.log('✅ SISTEMA ATUAL É ADEQUADO:')
    console.log('   • Custo aceitável')
    console.log('   • Funcionando conforme esperado')
    console.log('   • Apenas monitorar satisfação')
  } else {
    console.log('⚠️  SISTEMA ATUAL PRECISA AJUSTES:')
    console.log('   • Custo muito alto')
    console.log('   • Implementar versão otimizada')
  }
  
  await prisma.$disconnect()
}

function getPackEmoji(pack) {
  const emojis = {
    'Bronze': '🥉',
    'Prata': '🥈', 
    'Ouro': '🥇',
    'Platina': '💎',
    'Diamante': '💠'
  }
  return emojis[pack] || '📦'
}

analyzeFreePackLottery().catch(console.error)