const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Proposta de correção do balanceamento dos packs
const balanceFixes = {
  option1: {
    name: "OPÇÃO 1: Ajustar Probabilidades (Manter Preços)",
    description: "Aumentar chances de itens raros nos packs caros",
    changes: [
      {
        pack: "Pacote Prata",
        currentPrice: 40,
        newProbabilities: {
          COMUM: 45,      // era 50
          INCOMUM: 30,    // era 28  
          RARO: 18,       // era 15
          EPICO: 5,       // era 5
          LENDARIO: 2     // era 2
        },
        expectedROI: "~85%"
      },
      {
        pack: "Pacote Ouro", 
        currentPrice: 75,
        newProbabilities: {
          COMUM: 30,      // era 40
          INCOMUM: 32,    // era 30
          RARO: 25,       // era 20
          EPICO: 10,      // era 8
          LENDARIO: 3     // era 2
        },
        expectedROI: "~80%"
      },
      {
        pack: "Pacote Platina",
        currentPrice: 150, 
        newProbabilities: {
          COMUM: 15,      // era 25
          INCOMUM: 30,    // era 35
          RARO: 30,       // era 25
          EPICO: 15,      // era 10
          LENDARIO: 10    // era 5
        },
        expectedROI: "~85%"
      },
      {
        pack: "Pacote Diamante",
        currentPrice: 300,
        newProbabilities: {
          COMUM: 5,       // era 15
          INCOMUM: 20,    // era 30
          RARO: 35,       // era 30
          EPICO: 25,      // era 15
          LENDARIO: 15    // era 10
        },
        expectedROI: "~90%"
      }
    ]
  },
  
  option2: {
    name: "OPÇÃO 2: Reduzir Preços (Manter Probabilidades)",
    description: "Tornar os packs mais acessíveis",
    changes: [
      {
        pack: "Pacote Prata",
        currentPrice: 40,
        newPrice: 30,
        expectedROI: "~95%"
      },
      {
        pack: "Pacote Ouro",
        currentPrice: 75, 
        newPrice: 40,
        expectedROI: "~80%"
      },
      {
        pack: "Pacote Platina",
        currentPrice: 150,
        newPrice: 60,
        expectedROI: "~75%"
      },
      {
        pack: "Pacote Diamante", 
        currentPrice: 300,
        newPrice: 80,
        expectedROI: "~81%"
      }
    ]
  },
  
  option3: {
    name: "OPÇÃO 3: Abordagem Híbrida (Recomendada)",
    description: "Combinar ajustes de preços e probabilidades",
    changes: [
      {
        pack: "Pacote Bronze",
        action: "Manter como está (já equilibrado)",
        price: 25,
        probabilities: "Manter atuais"
      },
      {
        pack: "Pacote Prata", 
        action: "Reduzir preço levemente",
        currentPrice: 40,
        newPrice: 35,
        probabilities: {
          COMUM: 48,
          INCOMUM: 30,
          RARO: 16,
          EPICO: 4,
          LENDARIO: 2
        },
        expectedROI: "~85%"
      },
      {
        pack: "Pacote Ouro",
        action: "Reduzir preço moderadamente",
        currentPrice: 75,
        newPrice: 50, 
        probabilities: {
          COMUM: 35,
          INCOMUM: 32,
          RARO: 22,
          EPICO: 8,
          LENDARIO: 3
        },
        expectedROI: "~85%"
      },
      {
        pack: "Pacote Platina",
        action: "Reduzir preço significativamente",
        currentPrice: 150,
        newPrice: 85,
        probabilities: {
          COMUM: 20,
          INCOMUM: 32,
          RARO: 28,
          EPICO: 12,
          LENDARIO: 8
        },
        expectedROI: "~85%"
      },
      {
        pack: "Pacote Diamante",
        action: "Reformular completamente",
        currentPrice: 300,
        newPrice: 120,
        probabilities: {
          COMUM: 10,
          INCOMUM: 25,
          RARO: 32,
          EPICO: 20,
          LENDARIO: 13
        },
        expectedROI: "~90%"
      }
    ]
  }
}

async function analyzeBalanceFixes() {
  console.log('🔧 PROPOSTAS DE CORREÇÃO DO BALANCEAMENTO DOS PACKS\n')
  
  // Buscar dados atuais
  const items = await prisma.item.findMany({
    where: { 
      collection: {
        name: 'Genesis - Primeira Era'
      }
    },
    select: {
      rarity: true,
      value: true
    }
  })
  
  // Calcular valores médios por raridade
  const rarityAvgs = {}
  const rarityGroups = {}
  
  items.forEach(item => {
    if (!rarityGroups[item.rarity]) {
      rarityGroups[item.rarity] = []
    }
    rarityGroups[item.rarity].push(item.value)
  })
  
  Object.keys(rarityGroups).forEach(rarity => {
    const values = rarityGroups[rarity]
    rarityAvgs[rarity] = values.reduce((a, b) => a + b, 0) / values.length
  })
  
  console.log('💰 VALORES MÉDIOS POR RARIDADE:')
  Object.entries(rarityAvgs).forEach(([rarity, avg]) => {
    console.log(`   ${rarity}: ${Math.round(avg)} créditos`)
  })
  console.log('')
  
  // Analisar cada opção
  Object.values(balanceFixes).forEach(option => {
    console.log(`🎯 ${option.name}`)
    console.log(`   ${option.description}\n`)
    
    option.changes.forEach(change => {
      console.log(`   📦 ${change.pack}:`)
      
      if (change.currentPrice && change.newPrice) {
        console.log(`      💰 Preço: ${change.currentPrice} → ${change.newPrice} créditos`)
      }
      
      if (change.newProbabilities) {
        console.log(`      🎲 Novas probabilidades:`)
        Object.entries(change.newProbabilities).forEach(([rarity, prob]) => {
          console.log(`         ${rarity}: ${prob}%`)
        })
      }
      
      if (change.expectedROI) {
        console.log(`      📊 ROI esperado: ${change.expectedROI}`)
      }
      
      if (change.action) {
        console.log(`      🔧 Ação: ${change.action}`)
      }
      
      console.log('')
    })
    
    console.log('')
  })
  
  console.log('🏆 RECOMENDAÇÃO FINAL:')
  console.log('')
  console.log('   A OPÇÃO 3 (Híbrida) é a mais recomendada porque:')
  console.log('')
  console.log('   ✅ Benefícios:')
  console.log('      • ROI equilibrado (~85-90%) para todos os packs')
  console.log('      • Preços mais acessíveis')
  console.log('      • Progressão lógica de valor vs probabilidade')
  console.log('      • Mantém incentivo para packs premium')
  console.log('')
  console.log('   🎯 Resultado esperado:')
  console.log('      • Bronze (25): ROI ~93% (entrada)')
  console.log('      • Prata (35): ROI ~85% (popular)')
  console.log('      • Ouro (50): ROI ~85% (equilibrado)')
  console.log('      • Platina (85): ROI ~85% (premium)')
  console.log('      • Diamante (120): ROI ~90% (exclusivo)')
  console.log('')
  console.log('   🚀 Implementar a Opção 3?')
  
  await prisma.$disconnect()
}

analyzeBalanceFixes().catch(console.error)