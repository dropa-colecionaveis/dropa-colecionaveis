const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function comprehensiveProbabilityAnalysis() {
  console.log('🎯 ANÁLISE ULTRA-DETALHADA: Sistema de Probabilidades Otimizado\n')
  
  // Dados base do sistema
  const rarityValues = {
    COMUM: 13,      // 8-17 créditos (média)
    INCOMUM: 24,    // 18-29 créditos (média)
    RARO: 37,       // 30-45 créditos (média)
    EPICO: 67,      // 50-85 créditos (média)
    LENDARIO: 351   // 180-500 créditos (média)
  }
  
  const packPrices = {
    'Pacote Bronze': 25,
    'Pacote Prata': 35,
    'Pacote Ouro': 45,
    'Pacote Platina': 75,
    'Pacote Diamante': 95
  }
  
  // Valores reais dos pacotes de crédito (custo em R$)
  const realCosts = {
    'Pacote Bronze': { popular: 1.25, premium: 1.07 },
    'Pacote Prata': { popular: 1.75, premium: 1.50 },
    'Pacote Ouro': { popular: 2.25, premium: 1.93 },
    'Pacote Platina': { popular: 3.75, premium: 3.22 },
    'Pacote Diamante': { popular: 4.75, premium: 4.08 }
  }
  
  console.log('💰 ANÁLISE DE VALOR POR RARIDADE:\n')
  Object.entries(rarityValues).forEach(([rarity, value]) => {
    console.log(`${getRarityEmoji(rarity)} ${rarity}: ${value} créditos médio`)
  })
  console.log('')
  
  console.log('💸 CUSTO REAL DOS PACKS (em Reais):\n')
  Object.entries(realCosts).forEach(([pack, costs]) => {
    console.log(`📦 ${pack}: R$ ${costs.popular} (R$10) / R$ ${costs.premium} (R$60)`)
  })
  console.log('')
  
  // ANÁLISE 1: ROI ideal por faixa de preço
  console.log('🎯 ANÁLISE 1: ROI Ideal por Faixa de Preço\n')
  
  const targetROI = {
    'Pacote Bronze': { min: 90, max: 100, reason: 'Pack entrada - deve ser atrativo' },
    'Pacote Prata': { min: 80, max: 90, reason: 'Pack intermediário - bom valor' },
    'Pacote Ouro': { min: 75, max: 85, reason: 'Pack popular - equilibrado' },
    'Pacote Platina': { min: 70, max: 80, reason: 'Pack premium - valor justo' },
    'Pacote Diamante': { min: 75, max: 85, reason: 'Pack supremo - melhor experiência' }
  }
  
  console.log('ROI ALVO POR PACK:')
  Object.entries(targetROI).forEach(([pack, roi]) => {
    console.log(`📦 ${pack}: ${roi.min}-${roi.max}% (${roi.reason})`)
  })
  console.log('')
  
  // ANÁLISE 2: Progressão lógica de raridade
  console.log('🎯 ANÁLISE 2: Progressão Lógica de Raridade\n')
  
  const rarityProgression = {
    COMUM: {
      bronze: 'Alto (base do pack)',
      prata: 'Médio-Alto (ainda importante)',
      ouro: 'Médio (equilibrio)',
      platina: 'Baixo (foco em raros)',
      diamante: 'Muito Baixo (premium)'
    },
    INCOMUM: {
      bronze: 'Médio (complemento)',
      prata: 'Alto (foco principal)',
      ouro: 'Alto (importante)',
      platina: 'Médio (base premium)',
      diamante: 'Baixo (não foco)'
    },
    RARO: {
      bronze: 'Baixo (bonus)',
      prata: 'Médio (atrativo)',
      ouro: 'Alto (diferencial)',
      platina: 'Alto (importante)',
      diamante: 'Alto (base premium)'
    },
    EPICO: {
      bronze: 'Muito Baixo (raro)',
      prata: 'Baixo (especial)',
      ouro: 'Médio (atrativo)',
      platina: 'Alto (diferencial)',
      diamante: 'Muito Alto (destaque)'
    },
    LENDARIO: {
      bronze: 'Rarissimo (sonho)',
      prata: 'Muito Raro (sonho)',
      ouro: 'Raro (possível)',
      platina: 'Baixo (especial)',
      diamante: 'Médio (premium)'
    }
  }
  
  console.log('PROGRESSÃO IDEAL DE RARIDADE:')
  Object.entries(rarityProgression).forEach(([rarity, packs]) => {
    console.log(`${getRarityEmoji(rarity)} ${rarity}:`)
    Object.entries(packs).forEach(([pack, level]) => {
      console.log(`   ${pack}: ${level}`)
    })
    console.log('')
  })
  
  // ANÁLISE 3: Calcular probabilidades otimizadas
  console.log('🎯 ANÁLISE 3: Probabilidades Cientificamente Calculadas\n')
  
  // Função para calcular ROI com base nas probabilidades
  function calculateROI(probabilities, packPrice) {
    let expectedValue = 0
    Object.entries(probabilities).forEach(([rarity, prob]) => {
      expectedValue += (prob / 100) * rarityValues[rarity]
    })
    return (expectedValue / packPrice) * 100
  }
  
  // Função para otimizar probabilidades para um ROI alvo
  function optimizeProbabilities(packName, packPrice, targetROIRange) {
    console.log(`📦 OTIMIZANDO: ${packName} (${packPrice} créditos)`)
    console.log(`🎯 ROI alvo: ${targetROIRange.min}-${targetROIRange.max}%`)
    
    // Estratégias baseadas no tipo de pack
    let baseProbs = {}
    
    switch(packName) {
      case 'Pacote Bronze':
        baseProbs = {
          COMUM: 60,      // Alto - é a base
          INCOMUM: 25,    // Médio - complemento
          RARO: 10,       // Baixo - bonus
          EPICO: 4,       // Muito baixo
          LENDARIO: 1     // Rarissimo
        }
        break
        
      case 'Pacote Prata':
        baseProbs = {
          COMUM: 50,      // Médio-alto - ainda importante
          INCOMUM: 30,    // Alto - foco principal
          RARO: 15,       // Médio - atrativo
          EPICO: 4,       // Baixo - especial
          LENDARIO: 1     // Muito raro
        }
        break
        
      case 'Pacote Ouro':
        baseProbs = {
          COMUM: 40,      // Médio - equilibrio
          INCOMUM: 30,    // Alto - importante
          RARO: 20,       // Alto - diferencial
          EPICO: 7,       // Médio - atrativo
          LENDARIO: 3     // Raro - possível
        }
        break
        
      case 'Pacote Platina':
        baseProbs = {
          COMUM: 25,      // Baixo - foco em raros
          INCOMUM: 30,    // Médio - base premium
          RARO: 28,       // Alto - importante
          EPICO: 12,      // Alto - diferencial
          LENDARIO: 5     // Baixo - especial
        }
        break
        
      case 'Pacote Diamante':
        baseProbs = {
          COMUM: 15,      // Muito baixo - premium
          INCOMUM: 25,    // Baixo - não foco
          RARO: 30,       // Alto - base premium
          EPICO: 22,      // Muito alto - destaque
          LENDARIO: 8     // Médio - premium mas não comum
        }
        break
    }
    
    // Calcular ROI inicial
    let currentROI = calculateROI(baseProbs, packPrice)
    console.log(`   📊 ROI inicial: ${currentROI.toFixed(1)}%`)
    
    // Ajustar para ficar na faixa alvo
    let iterations = 0
    const maxIterations = 10
    
    while ((currentROI < targetROIRange.min || currentROI > targetROIRange.max) && iterations < maxIterations) {
      if (currentROI < targetROIRange.min) {
        // ROI muito baixo - aumentar itens valiosos
        if (baseProbs.LENDARIO < 10) baseProbs.LENDARIO += 0.5
        else if (baseProbs.EPICO < 25) baseProbs.EPICO += 1
        else if (baseProbs.RARO < 35) baseProbs.RARO += 1
        
        // Reduzir comuns proporcionalmente
        if (baseProbs.COMUM > 10) baseProbs.COMUM -= 1
        else if (baseProbs.INCOMUM > 20) baseProbs.INCOMUM -= 1
      } else {
        // ROI muito alto - reduzir itens valiosos
        if (baseProbs.LENDARIO > 1) baseProbs.LENDARIO -= 0.5
        else if (baseProbs.EPICO > 3) baseProbs.EPICO -= 1
        else if (baseProbs.RARO > 8) baseProbs.RARO -= 1
        
        // Aumentar comuns proporcionalmente
        baseProbs.COMUM += 1
      }
      
      // Normalizar para 100%
      const total = Object.values(baseProbs).reduce((a, b) => a + b, 0)
      Object.keys(baseProbs).forEach(rarity => {
        baseProbs[rarity] = (baseProbs[rarity] / total) * 100
      })
      
      currentROI = calculateROI(baseProbs, packPrice)
      iterations++
    }
    
    console.log(`   🎲 Probabilidades otimizadas:`)
    Object.entries(baseProbs).forEach(([rarity, prob]) => {
      const contribution = ((prob / 100) * rarityValues[rarity]).toFixed(1)
      console.log(`      ${getRarityEmoji(rarity)} ${rarity}: ${prob.toFixed(1)}% (${contribution} créditos)`)
    })
    
    console.log(`   ✅ ROI final: ${currentROI.toFixed(1)}%`)
    console.log(`   💸 Custo real: R$ ${realCosts[packName].popular}`)
    console.log('')
    
    return baseProbs
  }
  
  // Otimizar todos os packs
  const optimizedProbabilities = {}
  Object.entries(packPrices).forEach(([packName, price]) => {
    optimizedProbabilities[packName] = optimizeProbabilities(packName, price, targetROI[packName])
  })
  
  // ANÁLISE 4: Comparação com sistema atual
  console.log('🎯 ANÁLISE 4: Comparação com Sistema Atual\n')
  
  const currentPacks = await prisma.pack.findMany({
    where: { isActive: true },
    include: { probabilities: true },
    orderBy: { price: 'asc' }
  })
  
  console.log('COMPARAÇÃO: ATUAL vs OTIMIZADO')
  console.log('')
  
  currentPacks.forEach(pack => {
    console.log(`📦 ${pack.name}:`)
    
    // ROI atual
    let currentExpectedValue = 0
    const currentProbs = {}
    pack.probabilities.forEach(prob => {
      currentProbs[prob.rarity] = prob.percentage
      currentExpectedValue += (prob.percentage / 100) * rarityValues[prob.rarity]
    })
    const currentROI = (currentExpectedValue / pack.price) * 100
    
    // ROI otimizado
    const optimizedProbs = optimizedProbabilities[pack.name]
    let optimizedExpectedValue = 0
    Object.entries(optimizedProbs).forEach(([rarity, prob]) => {
      optimizedExpectedValue += (prob / 100) * rarityValues[rarity]
    })
    const optimizedROI = (optimizedExpectedValue / pack.price) * 100
    
    console.log(`   ATUAL: ROI ${currentROI.toFixed(1)}%`)
    Object.entries(currentProbs).forEach(([rarity, prob]) => {
      console.log(`      ${getRarityEmoji(rarity)} ${rarity}: ${prob}%`)
    })
    
    console.log(`   OTIMIZADO: ROI ${optimizedROI.toFixed(1)}%`)
    Object.entries(optimizedProbs).forEach(([rarity, prob]) => {
      const change = prob - (currentProbs[rarity] || 0)
      const arrow = change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️'
      console.log(`      ${getRarityEmoji(rarity)} ${rarity}: ${prob.toFixed(1)}% ${arrow}`)
    })
    console.log('')
  })
  
  // ANÁLISE 5: Validação econômica
  console.log('🎯 ANÁLISE 5: Validação Econômica\n')
  
  console.log('IMPACTO NO ECOSSISTEMA:')
  console.log('')
  
  Object.entries(optimizedProbabilities).forEach(([packName, probs]) => {
    const price = packPrices[packName]
    let expectedValue = 0
    Object.entries(probs).forEach(([rarity, prob]) => {
      expectedValue += (prob / 100) * rarityValues[rarity]
    })
    const roi = (expectedValue / price) * 100
    
    console.log(`📦 ${packName}:`)
    console.log(`   💰 Valor esperado: ${expectedValue.toFixed(1)} créditos`)
    console.log(`   📊 ROI: ${roi.toFixed(1)}%`)
    console.log(`   💸 Custo real: R$ ${realCosts[packName].popular} - R$ ${realCosts[packName].premium}`)
    
    // Análise de sustentabilidade
    if (roi > 85) {
      console.log(`   ⚠️  ROI alto - favorável ao jogador`)
    } else if (roi < 65) {
      console.log(`   ⚠️  ROI baixo - pode desincentivar compras`)
    } else {
      console.log(`   ✅ ROI equilibrado`)
    }
    
    // Análise de lendários
    const legendaryRate = probs.LENDARIO
    if (legendaryRate > 10) {
      console.log(`   ⚠️  Taxa de lendário muito alta (${legendaryRate.toFixed(1)}%)`)
    } else if (legendaryRate < 1) {
      console.log(`   ⚠️  Taxa de lendário muito baixa (${legendaryRate.toFixed(1)}%)`)
    } else {
      console.log(`   ✅ Taxa de lendário equilibrada (${legendaryRate.toFixed(1)}%)`)
    }
    console.log('')
  })
  
  console.log('🏆 RECOMENDAÇÃO FINAL CIENTIFICAMENTE CALCULADA:')
  console.log('')
  console.log('✅ SISTEMA OTIMIZADO OFERECE:')
  console.log('   • ROI equilibrado em todas as faixas (65-95%)')
  console.log('   • Progressão clara de valor vs preço')
  console.log('   • Incentivo real para packs premium')
  console.log('   • Sustentabilidade econômica')
  console.log('   • Experiência recompensante para todos os perfis')
  console.log('')
  console.log('🚀 IMPLEMENTAR SISTEMA OTIMIZADO?')
  
  // Salvar configuração recomendada
  console.log('📋 CONFIGURAÇÃO FINAL RECOMENDADA:')
  console.log('')
  Object.entries(optimizedProbabilities).forEach(([packName, probs]) => {
    console.log(`${packName}:`)
    Object.entries(probs).forEach(([rarity, prob]) => {
      console.log(`  ${rarity}: ${Math.round(prob)}%`)
    })
    console.log('')
  })
  
  await prisma.$disconnect()
  return optimizedProbabilities
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

comprehensiveProbabilityAnalysis().catch(console.error)