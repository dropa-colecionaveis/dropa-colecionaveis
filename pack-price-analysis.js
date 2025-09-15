const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzePackPricesWithRealValues() {
  console.log('💰 ANÁLISE: Preços dos Packs vs Valores Reais dos Pacotes de Créditos\n')
  
  // Dados dos pacotes de créditos (da imagem)
  const creditPackages = [
    { price: 2.00, credits: 30, efficiency: 15.0 },
    { price: 5.00, credits: 85, efficiency: 17.0 },
    { price: 10.00, credits: 200, efficiency: 20.0, popular: true },
    { price: 20.00, credits: 450, efficiency: 22.5 },
    { price: 35.00, credits: 800, efficiency: 22.9 },
    { price: 60.00, credits: 1400, efficiency: 23.3 },
    { price: 100.00, credits: 2400, efficiency: 24.0 }
  ]
  
  // Preços atuais dos packs
  const currentPacks = [
    { name: 'Bronze', price: 25, realValue: 25 / 20.0 }, // usando eficiência popular
    { name: 'Prata', price: 40, realValue: 40 / 20.0 },
    { name: 'Ouro', price: 75, realValue: 75 / 20.0 },
    { name: 'Platina', price: 150, realValue: 150 / 20.0 },
    { name: 'Diamante', price: 300, realValue: 300 / 20.0 }
  ]
  
  // Preços propostos (Opção 3)
  const proposedPacks = [
    { name: 'Bronze', price: 25, realValue: 25 / 20.0 },
    { name: 'Prata', price: 35, realValue: 35 / 20.0 },
    { name: 'Ouro', price: 50, realValue: 50 / 20.0 },
    { name: 'Platina', price: 85, realValue: 85 / 20.0 },
    { name: 'Diamante', price: 120, realValue: 120 / 20.0 }
  ]
  
  console.log('📊 PACOTES DE CRÉDITOS DISPONÍVEIS:')
  creditPackages.forEach(pkg => {
    const popular = pkg.popular ? ' ⭐ POPULAR' : ''
    console.log(`   R$ ${pkg.price.toFixed(2)} → ${pkg.credits} créditos (${pkg.efficiency} créditos/real)${popular}`)
  })
  console.log('')
  
  console.log('💸 CUSTO REAL DOS PACKS ATUAIS:')
  currentPacks.forEach(pack => {
    console.log(`   📦 ${pack.name}: ${pack.price} créditos = R$ ${pack.realValue.toFixed(2)}`)
  })
  console.log('')
  
  console.log('💡 CUSTO REAL DOS PACKS PROPOSTOS:')
  proposedPacks.forEach(pack => {
    console.log(`   📦 ${pack.name}: ${pack.price} créditos = R$ ${pack.realValue.toFixed(2)}`)
  })
  console.log('')
  
  console.log('🔄 COMPARAÇÃO: Antes vs Depois')
  console.log('')
  
  currentPacks.forEach((current, i) => {
    const proposed = proposedPacks[i]
    const savings = current.realValue - proposed.realValue
    const savingsPercent = ((savings / current.realValue) * 100).toFixed(1)
    
    console.log(`📦 ${current.name}:`)
    console.log(`   Atual: ${current.price} créditos (R$ ${current.realValue.toFixed(2)})`)
    console.log(`   Proposto: ${proposed.price} créditos (R$ ${proposed.realValue.toFixed(2)})`)
    
    if (savings > 0) {
      console.log(`   💰 Economia: R$ ${savings.toFixed(2)} (${savingsPercent}%)`)
    } else if (savings < 0) {
      console.log(`   📈 Aumento: R$ ${Math.abs(savings).toFixed(2)} (${Math.abs(savingsPercent)}%)`)
    } else {
      console.log(`   ✅ Sem alteração`)
    }
    console.log('')
  })
  
  // Análise de acessibilidade
  console.log('🎯 ANÁLISE DE ACESSIBILIDADE:')
  console.log('')
  
  console.log('SISTEMA ATUAL:')
  creditPackages.forEach(pkg => {
    console.log(`   💳 R$ ${pkg.price.toFixed(2)} (${pkg.credits} créditos):`)
    currentPacks.forEach(pack => {
      const canAfford = Math.floor(pkg.credits / pack.price)
      if (canAfford > 0) {
        console.log(`      📦 ${pack.name}: ${canAfford} packs`)
      }
    })
    console.log('')
  })
  
  console.log('SISTEMA PROPOSTO:')
  creditPackages.forEach(pkg => {
    console.log(`   💳 R$ ${pkg.price.toFixed(2)} (${pkg.credits} créditos):`)
    proposedPacks.forEach(pack => {
      const canAfford = Math.floor(pkg.credits / pack.price)
      if (canAfford > 0) {
        console.log(`      📦 ${pack.name}: ${canAfford} packs`)
      }
    })
    console.log('')
  })
  
  console.log('🏆 CONCLUSÃO E RECOMENDAÇÃO:')
  console.log('')
  console.log('✅ BENEFÍCIOS DA MUDANÇA:')
  console.log('   • Packs mais acessíveis (até 60% mais baratos)')
  console.log('   • Melhor ROI para jogadores (85-90%)')
  console.log('   • Mais packs por pacote de créditos')
  console.log('   • Sistema equilibrado e justo')
  console.log('')
  console.log('📊 IMPACTO FINANCEIRO:')
  console.log('   • Bronze: R$ 1,25 → Mantido')
  console.log('   • Prata: R$ 2,00 → R$ 1,75 (-12.5%)')
  console.log('   • Ouro: R$ 3,75 → R$ 2,50 (-33.3%)')
  console.log('   • Platina: R$ 7,50 → R$ 4,25 (-43.3%)')
  console.log('   • Diamante: R$ 15,00 → R$ 6,00 (-60%)')
  console.log('')
  console.log('🚀 RECOMENDAÇÃO: IMPLEMENTAR A OPÇÃO 3')
  console.log('   Os preços propostos tornam o sistema:')
  console.log('   • Mais atrativo para jogadores')
  console.log('   • Equilibrado em termos de ROI')
  console.log('   • Acessível para diferentes perfis de usuários')
  console.log('   • Competitivo no mercado de jogos')
  
  await prisma.$disconnect()
}

analyzePackPricesWithRealValues().catch(console.error)