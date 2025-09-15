const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function correctCreditAnalysis() {
  console.log('🔄 ANÁLISE CORRIGIDA: Valores Reais dos Pacotes de Créditos\n')
  
  // VALORES CORRETOS dos pacotes de créditos (conforme informado)
  const correctCreditPackages = [
    { price: 2.00, credits: 30, efficiency: 15.0 },
    { price: 5.00, credits: 85, efficiency: 17.0 },
    { price: 10.00, credits: 200, efficiency: 20.0 },
    { price: 20.00, credits: 450, efficiency: 22.5 },
    { price: 35.00, credits: 800, efficiency: 22.9 },
    { price: 60.00, credits: 1400, efficiency: 23.3 },
    { price: 100.00, credits: 2400, efficiency: 24.0 }
  ]
  
  // Buscar preços atuais dos packs após nossa atualização
  const currentPacks = await prisma.pack.findMany({
    where: { isActive: true },
    include: { probabilities: true },
    orderBy: { price: 'asc' }
  })
  
  // Valores médios por raridade
  const rarityValues = {
    'COMUM': 13,
    'INCOMUM': 24,
    'RARO': 37,
    'EPICO': 67,
    'LENDARIO': 351
  }
  
  console.log('💰 PACOTES DE CRÉDITOS (VALORES CORRETOS):')
  correctCreditPackages.forEach(pkg => {
    console.log(`   R$ ${pkg.price.toFixed(2)} → ${pkg.credits} créditos (${pkg.efficiency.toFixed(1)} créditos/real)`)
  })
  console.log('')
  
  console.log('📦 PACKS ATUAIS (APÓS NOSSA ATUALIZAÇÃO):')
  currentPacks.forEach(pack => {
    let expectedValue = 0
    pack.probabilities.forEach(prob => {
      expectedValue += (prob.percentage / 100) * rarityValues[prob.rarity]
    })
    
    const roi = ((expectedValue / pack.price) * 100)
    console.log(`   ${pack.name}: ${pack.price} créditos (valor esperado: ${Math.round(expectedValue)}, ROI: ${roi.toFixed(1)}%)`)
  })
  console.log('')
  
  console.log('💸 CUSTO REAL DOS PACKS (CÁLCULO CORRETO):')
  console.log('')
  
  // Calcular custo real usando a eficiência média dos pacotes de créditos mais populares
  const popularEfficiency = 20.0 // R$ 10 = 200 créditos
  const premiumEfficiency = 23.3 // R$ 60 = 1400 créditos
  
  currentPacks.forEach(pack => {
    const costPopular = pack.price / popularEfficiency
    const costPremium = pack.price / premiumEfficiency
    
    console.log(`📦 ${pack.name} (${pack.price} créditos):`)
    console.log(`   💰 Custo com pacote R$ 10: R$ ${costPopular.toFixed(2)}`)
    console.log(`   💎 Custo com pacote R$ 60: R$ ${costPremium.toFixed(2)}`)
    console.log('')
  })
  
  console.log('🎯 ANÁLISE DE ACESSIBILIDADE CORRIGIDA:')
  console.log('')
  
  correctCreditPackages.forEach(pkg => {
    console.log(`💳 R$ ${pkg.price.toFixed(2)} (${pkg.credits} créditos):`)
    
    currentPacks.forEach(pack => {
      const canAfford = Math.floor(pkg.credits / pack.price)
      const leftover = pkg.credits % pack.price
      
      if (canAfford > 0) {
        console.log(`   📦 ${pack.name}: ${canAfford} packs (sobra: ${leftover} créditos)`)
      }
    })
    console.log('')
  })
  
  console.log('📊 ANÁLISE DE EFICIÊNCIA DE COMPRA:')
  console.log('')
  
  // Calcular qual pacote de crédito oferece melhor valor para cada tipo de pack
  currentPacks.forEach(pack => {
    console.log(`📦 Para comprar ${pack.name} (${pack.price} créditos):`)
    
    let bestDeal = null
    let bestEfficiency = 0
    
    correctCreditPackages.forEach(creditPkg => {
      if (creditPkg.credits >= pack.price) {
        const efficiency = pack.price / creditPkg.price
        const leftoverValue = (creditPkg.credits - pack.price) / creditPkg.price
        const totalValue = efficiency + leftoverValue
        
        console.log(`   💳 R$ ${creditPkg.price.toFixed(2)}: ${efficiency.toFixed(1)} créditos/real + sobra R$ ${leftoverValue.toFixed(2)}`)
        
        if (totalValue > bestEfficiency) {
          bestEfficiency = totalValue
          bestDeal = creditPkg
        }
      }
    })
    
    if (bestDeal) {
      console.log(`   ⭐ MELHOR: R$ ${bestDeal.price.toFixed(2)} (sobra: ${bestDeal.credits - pack.price} créditos)`)
    }
    console.log('')
  })
  
  // Verificar se nossos preços estão bem balanceados
  console.log('🔍 VERIFICAÇÃO: Nossos preços estão bem balanceados?')
  console.log('')
  
  const issues = []
  const recommendations = []
  
  // Verificar se existe muito gap entre pacotes de créditos e packs
  const minCreditPackage = correctCreditPackages[0].credits // 30
  const maxCreditPackage = correctCreditPackages[correctCreditPackages.length - 1].credits // 2400
  
  const minPack = Math.min(...currentPacks.map(p => p.price)) // 25
  const maxPack = Math.max(...currentPacks.map(p => p.price)) // 120
  
  console.log(`💡 RANGE DE VALORES:`)
  console.log(`   Pacotes de créditos: ${minCreditPackage} - ${maxCreditPackage} créditos`)
  console.log(`   Packs de itens: ${minPack} - ${maxPack} créditos`)
  console.log('')
  
  // Verificar eficiência dos packs
  currentPacks.forEach(pack => {
    let expectedValue = 0
    pack.probabilities.forEach(prob => {
      expectedValue += (prob.percentage / 100) * rarityValues[prob.rarity]
    })
    
    const roi = (expectedValue / pack.price) * 100
    
    if (roi < 60) {
      issues.push(`${pack.name}: ROI muito baixo (${roi.toFixed(1)}%)`)
      recommendations.push(`Reduzir preço do ${pack.name} ou aumentar probabilidades`)
    } else if (roi > 100) {
      issues.push(`${pack.name}: ROI muito alto (${roi.toFixed(1)}%) - muito lucrativo`)
      recommendations.push(`Aumentar preço do ${pack.name} ou reduzir probabilidades`)
    }
  })
  
  console.log('🚨 PROBLEMAS IDENTIFICADOS:')
  if (issues.length > 0) {
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`)
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
    console.log('   ✅ Sistema bem balanceado!')
  }
  console.log('')
  
  // Propor ajustes se necessário
  console.log('🎯 PROPOSTA DE OTIMIZAÇÃO FINAL:')
  console.log('')
  
  const optimizedPacks = [
    { name: 'Bronze', currentPrice: 25, suggestedPrice: 25, reason: 'Já equilibrado (ROI ~95%)' },
    { name: 'Prata', currentPrice: 35, suggestedPrice: 35, reason: 'Bom equilíbrio (ROI ~83%)' },
    { name: 'Ouro', currentPrice: 50, suggestedPrice: 45, reason: 'Pequeno ajuste para ROI ~80%' },
    { name: 'Platina', currentPrice: 85, suggestedPrice: 75, reason: 'Melhorar ROI para ~76%' },
    { name: 'Diamante', currentPrice: 120, suggestedPrice: 95, reason: 'Tornar mais acessível, ROI ~82%' }
  ]
  
  optimizedPacks.forEach(pack => {
    const currentPack = currentPacks.find(p => p.name.includes(pack.name))
    if (currentPack) {
      let expectedValue = 0
      currentPack.probabilities.forEach(prob => {
        expectedValue += (prob.percentage / 100) * rarityValues[prob.rarity]
      })
      
      const currentROI = ((expectedValue / pack.currentPrice) * 100).toFixed(1)
      const suggestedROI = ((expectedValue / pack.suggestedPrice) * 100).toFixed(1)
      
      console.log(`📦 ${pack.name}:`)
      console.log(`   Atual: ${pack.currentPrice} créditos (ROI: ${currentROI}%)`)
      console.log(`   Sugerido: ${pack.suggestedPrice} créditos (ROI: ${suggestedROI}%)`)
      console.log(`   Motivo: ${pack.reason}`)
      console.log('')
    }
  })
  
  await prisma.$disconnect()
}

correctCreditAnalysis().catch(console.error)