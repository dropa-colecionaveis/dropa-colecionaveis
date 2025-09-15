const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function calculateBalancedProbabilities() {
  console.log('🎯 ANÁLISE: Probabilidades Balanceadas para Lendários\n')
  
  // Valores médios por raridade (reais do sistema)
  const rarityValues = {
    COMUM: 13,
    INCOMUM: 24,
    RARO: 37,
    EPICO: 67,
    LENDARIO: 351
  }
  
  // Preços dos packs
  const packPrices = {
    Bronze: 25,
    Prata: 35,
    Ouro: 45,
    Platina: 75,
    Diamante: 95
  }
  
  console.log('💰 VALOR DOS LENDÁRIOS: 351 créditos (média)\n')
  console.log('⚠️  PROBLEMA: 13% de chance no Diamante é muito alto!\n')
  
  // Proposta de probabilidades mais equilibradas
  const balancedProbabilities = {
    Bronze: {
      COMUM: 60,
      INCOMUM: 25,
      RARO: 10,
      EPICO: 4,
      LENDARIO: 1    // Mantido - muito raro
    },
    Prata: {
      COMUM: 48,
      INCOMUM: 30,
      RARO: 16,
      EPICO: 4,
      LENDARIO: 2    // Mantido - ainda raro
    },
    Ouro: {
      COMUM: 35,
      INCOMUM: 32,
      RARO: 22,
      EPICO: 8,
      LENDARIO: 3    // Mantido - chance pequena
    },
    Platina: {
      COMUM: 20,
      INCOMUM: 32,
      RARO: 28,
      EPICO: 15,     // Aumentar épico
      LENDARIO: 5    // Reduzir de 8% para 5%
    },
    Diamante: {
      COMUM: 10,
      INCOMUM: 25,
      RARO: 32,
      EPICO: 25,     // Aumentar épico de 20% para 25%
      LENDARIO: 8    // REDUZIR de 13% para 8%
    }
  }
  
  console.log('📊 COMPARAÇÃO: Probabilidades Atuais vs Propostas\n')
  
  Object.entries(balancedProbabilities).forEach(([pack, probs]) => {
    console.log(`📦 ${pack} (${packPrices[pack]} créditos):`)
    
    // Calcular valor esperado
    let expectedValue = 0
    Object.entries(probs).forEach(([rarity, prob]) => {
      expectedValue += (prob / 100) * rarityValues[rarity]
    })
    
    const roi = ((expectedValue / packPrices[pack]) * 100).toFixed(1)
    
    console.log(`   🎲 Probabilidades:`)
    Object.entries(probs).forEach(([rarity, prob]) => {
      const contribution = ((prob / 100) * rarityValues[rarity]).toFixed(1)
      console.log(`      ${rarity}: ${prob}% (contribui ${contribution} créditos)`)
    })
    
    console.log(`   💰 Valor esperado: ${expectedValue.toFixed(1)} créditos`)
    console.log(`   📊 ROI: ${roi}%`)
    console.log('')
  })
  
  console.log('🎯 ANÁLISE DO IMPACTO DA MUDANÇA NO DIAMANTE:\n')
  
  const oldDiamond = {
    COMUM: 10,
    INCOMUM: 25,
    RARO: 32,
    EPICO: 20,
    LENDARIO: 13
  }
  
  const newDiamond = balancedProbabilities.Diamante
  
  // Calcular valores esperados
  let oldValue = 0
  let newValue = 0
  
  Object.entries(oldDiamond).forEach(([rarity, prob]) => {
    oldValue += (prob / 100) * rarityValues[rarity]
  })
  
  Object.entries(newDiamond).forEach(([rarity, prob]) => {
    newValue += (prob / 100) * rarityValues[rarity]
  })
  
  const oldROI = ((oldValue / packPrices.Diamante) * 100).toFixed(1)
  const newROI = ((newValue / packPrices.Diamante) * 100).toFixed(1)
  
  console.log('📦 PACOTE DIAMANTE - Análise Detalhada:')
  console.log('')
  console.log('ANTES (problemático):')
  console.log(`   🟡 LENDÁRIO: 13% × 351 = 45.6 créditos`)
  console.log(`   🟣 ÉPICO: 20% × 67 = 13.4 créditos`)
  console.log(`   💰 Valor total esperado: ${oldValue.toFixed(1)} créditos`)
  console.log(`   📊 ROI: ${oldROI}%`)
  console.log('')
  console.log('DEPOIS (equilibrado):')
  console.log(`   🟡 LENDÁRIO: 8% × 351 = 28.1 créditos`)
  console.log(`   🟣 ÉPICO: 25% × 67 = 16.8 créditos`)
  console.log(`   💰 Valor total esperado: ${newValue.toFixed(1)} créditos`)
  console.log(`   📊 ROI: ${newROI}%`)
  console.log('')
  
  console.log('✅ VANTAGENS DA MUDANÇA:')
  console.log('   • Lendário mantém raridade real (8% ainda é alto!)')
  console.log('   • ROI mais equilibrado')
  console.log('   • Épicos ganham mais destaque')
  console.log('   • Sistema econômico mais sustentável')
  console.log('')
  
  console.log('🎮 EXPERIÊNCIA DO JOGADOR:')
  console.log('   • Bronze/Prata/Ouro: 1-3% de lendário (muito raro)')
  console.log('   • Platina: 5% de lendário (especial)')
  console.log('   • Diamante: 8% de lendário (premium, mas não comum)')
  console.log('')
  
  console.log('💡 RECOMENDAÇÃO FINAL:')
  console.log('   REDUZIR Diamante de 13% → 8% para LENDÁRIO')
  console.log('   AUMENTAR Diamante de 20% → 25% para ÉPICO')
  console.log('   REDUZIR Platina de 8% → 5% para LENDÁRIO')
  console.log('   AUMENTAR Platina de 12% → 15% para ÉPICO')
  
  await prisma.$disconnect()
}

calculateBalancedProbabilities().catch(console.error)