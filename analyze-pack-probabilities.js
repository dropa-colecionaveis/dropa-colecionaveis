const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzePackProbabilities() {
  console.log('🎲 ANÁLISE DETALHADA: Probabilidades dos Pacotes vs Distribuição Real dos Itens\n')
  
  // Buscar dados atuais
  const genesis = await prisma.collection.findFirst({
    where: { name: 'Genesis - Primeira Era' }
  })
  
  const items = await prisma.item.findMany({
    where: { collectionId: genesis.id },
    select: {
      rarity: true,
      scarcityLevel: true,
      value: true,
      isUnique: true,
      isLimitedEdition: true
    }
  })
  
  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    include: { probabilities: true },
    orderBy: { price: 'asc' }
  })
  
  // Analisar distribuição real dos itens
  console.log('📊 DISTRIBUIÇÃO REAL DOS ITENS NA COLEÇÃO:\n')
  
  const itemDistribution = {}
  const totalItems = items.length
  
  items.forEach(item => {
    if (!itemDistribution[item.rarity]) {
      itemDistribution[item.rarity] = {
        count: 0,
        percentage: 0,
        scarcities: {},
        values: [],
        special: { unique: 0, limited: 0, normal: 0 }
      }
    }
    
    itemDistribution[item.rarity].count++
    itemDistribution[item.rarity].values.push(item.value)
    
    // Contar por escassez
    if (!itemDistribution[item.rarity].scarcities[item.scarcityLevel]) {
      itemDistribution[item.rarity].scarcities[item.scarcityLevel] = 0
    }
    itemDistribution[item.rarity].scarcities[item.scarcityLevel]++
    
    // Contar tipos especiais
    if (item.isUnique) {
      itemDistribution[item.rarity].special.unique++
    } else if (item.isLimitedEdition) {
      itemDistribution[item.rarity].special.limited++
    } else {
      itemDistribution[item.rarity].special.normal++
    }
  })
  
  // Calcular percentuais
  Object.keys(itemDistribution).forEach(rarity => {
    itemDistribution[rarity].percentage = ((itemDistribution[rarity].count / totalItems) * 100).toFixed(1)
  })
  
  // Mostrar distribuição real
  console.log('🎯 DISTRIBUIÇÃO REAL POR RARIDADE:')
  Object.entries(itemDistribution).forEach(([rarity, data]) => {
    const avgValue = Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length)
    const minValue = Math.min(...data.values)
    const maxValue = Math.max(...data.values)
    
    console.log(`   ${getRarityEmoji(rarity)} ${rarity}: ${data.count} itens (${data.percentage}%)`)
    console.log(`      💰 Valores: ${minValue}-${maxValue} créditos (média: ${avgValue})`)
    console.log(`      🎭 Tipos: ${data.special.unique} únicos, ${data.special.limited} limitados, ${data.special.normal} normais`)
    console.log(`      📊 Escassez: ${Object.entries(data.scarcities).map(([s, c]) => `${s}(${c})`).join(', ')}`)
    console.log('')
  })
  
  // Analisar probabilidades atuais dos packs
  console.log('📦 PROBABILIDADES ATUAIS DOS PACOTES:\n')
  
  packs.forEach(pack => {
    console.log(`${pack.name} (${pack.price} créditos):`)
    
    let totalProb = 0
    pack.probabilities.forEach(prob => {
      console.log(`   ${getRarityEmoji(prob.rarity)} ${prob.rarity}: ${prob.percentage}%`)
      totalProb += prob.percentage
    })
    
    console.log(`   📊 Total: ${totalProb}%`)
    console.log('')
  })
  
  // Calcular valor esperado atual de cada pack
  console.log('💰 VALOR ESPERADO ATUAL (com distribuição real):\n')
  
  const rarityAvgs = {}
  Object.entries(itemDistribution).forEach(([rarity, data]) => {
    rarityAvgs[rarity] = data.values.reduce((a, b) => a + b, 0) / data.values.length
  })
  
  packs.forEach(pack => {
    let expectedValue = 0
    let detailBreakdown = []
    
    pack.probabilities.forEach(prob => {
      const contribution = (prob.percentage / 100) * rarityAvgs[prob.rarity]
      expectedValue += contribution
      detailBreakdown.push({
        rarity: prob.rarity,
        prob: prob.percentage,
        avgValue: Math.round(rarityAvgs[prob.rarity]),
        contribution: Math.round(contribution)
      })
    })
    
    const roi = ((expectedValue / pack.price) * 100).toFixed(1)
    
    console.log(`📦 ${pack.name}:`)
    console.log(`   💰 Valor esperado: ${Math.round(expectedValue)} créditos`)
    console.log(`   📊 ROI: ${roi}%`)
    console.log(`   🔍 Breakdown:`)
    
    detailBreakdown.forEach(item => {
      console.log(`      ${getRarityEmoji(item.rarity)} ${item.rarity}: ${item.prob}% × ${item.avgValue} = ${item.contribution} créditos`)
    })
    console.log('')
  })
  
  // Propor otimizações baseadas na distribuição real
  console.log('🎯 ANÁLISE E PROPOSTAS DE OTIMIZAÇÃO:\n')
  
  const problems = []
  const recommendations = []
  
  // Verificar se as probabilidades fazem sentido com a distribuição real
  console.log('⚖️  COMPARAÇÃO: Probabilidades vs Distribuição Real')
  console.log('')
  
  Object.entries(itemDistribution).forEach(([rarity, data]) => {
    console.log(`${getRarityEmoji(rarity)} ${rarity}:`)
    console.log(`   📊 Na coleção: ${data.percentage}% dos itens`)
    console.log(`   🎲 Nos packs:`)
    
    packs.forEach(pack => {
      const prob = pack.probabilities.find(p => p.rarity === rarity)
      if (prob) {
        const ratio = (prob.percentage / parseFloat(data.percentage)).toFixed(1)
        console.log(`      ${pack.name}: ${prob.percentage}% (${ratio}x a distribuição real)`)
      }
    })
    console.log('')
  })
  
  // Propor probabilidades otimizadas
  console.log('💡 PROPOSTA DE PROBABILIDADES OTIMIZADAS:\n')
  
  const optimizedProbabilities = {
    'Pacote Bronze': {
      reasoning: 'Pack de entrada - foco em itens comuns e incomuns',
      probabilities: {
        COMUM: 55,      // Reduzir um pouco para dar mais valor
        INCOMUM: 28,    // Manter atrativo
        RARO: 12,       // Aumentar levemente
        EPICO: 4,       // Manter
        LENDARIO: 1     // Manter raro
      }
    },
    'Pacote Prata': {
      reasoning: 'Pack intermediário - melhor chance de raros',
      probabilities: {
        COMUM: 45,      // Reduzir
        INCOMUM: 32,    // Aumentar
        RARO: 18,       // Aumentar
        EPICO: 4,       // Manter
        LENDARIO: 1     // Manter
      }
    },
    'Pacote Ouro': {
      reasoning: 'Pack popular - equilibrio entre acessibilidade e valor',
      probabilities: {
        COMUM: 35,      // Reduzir significativamente
        INCOMUM: 35,    // Aumentar
        RARO: 22,       // Aumentar
        EPICO: 6,       // Aumentar
        LENDARIO: 2     // Dobrar chance
      }
    },
    'Pacote Platina': {
      reasoning: 'Pack premium - foco em itens raros e épicos',
      probabilities: {
        COMUM: 20,      // Reduzir muito
        INCOMUM: 30,    // Manter base
        RARO: 30,       // Aumentar muito
        EPICO: 15,      // Aumentar significativamente
        LENDARIO: 5     // Aumentar muito
      }
    },
    'Pacote Diamante': {
      reasoning: 'Pack supremo - máximas chances de itens valiosos',
      probabilities: {
        COMUM: 10,      // Mínimo
        INCOMUM: 25,    // Reduzir
        RARO: 35,       // Máximo para raros
        EPICO: 22,      // Aumentar muito
        LENDARIO: 8     // Aumentar muito
      }
    }
  }
  
  Object.entries(optimizedProbabilities).forEach(([packName, config]) => {
    console.log(`📦 ${packName}:`)
    console.log(`   🎯 Estratégia: ${config.reasoning}`)
    console.log(`   🎲 Probabilidades sugeridas:`)
    
    let expectedValue = 0
    Object.entries(config.probabilities).forEach(([rarity, prob]) => {
      expectedValue += (prob / 100) * rarityAvgs[rarity]
      console.log(`      ${getRarityEmoji(rarity)} ${rarity}: ${prob}%`)
    })
    
    // Encontrar pack atual para comparar
    const currentPack = packs.find(p => p.name === packName)
    if (currentPack) {
      const newROI = ((expectedValue / currentPack.price) * 100).toFixed(1)
      console.log(`   📊 ROI estimado: ${newROI}%`)
    }
    console.log('')
  })
  
  console.log('🏆 RECOMENDAÇÃO FINAL:')
  console.log('')
  console.log('✅ BENEFÍCIOS DAS PROBABILIDADES OTIMIZADAS:')
  console.log('   • Progressão mais clara entre packs')
  console.log('   • ROI mais equilibrado em todos os níveis')
  console.log('   • Incentivo real para comprar packs premium')
  console.log('   • Experiência mais recompensante')
  console.log('')
  console.log('📈 IMPACTO ESPERADO:')
  console.log('   • Bronze: Mantém acessibilidade')
  console.log('   • Prata: Melhor valor intermediário')
  console.log('   • Ouro: Pack popular mais atrativo')
  console.log('   • Platina: Verdadeiro pack premium')
  console.log('   • Diamante: Experiência suprema')
  console.log('')
  console.log('🚀 Implementar as probabilidades otimizadas?')
  
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

analyzePackProbabilities().catch(console.error)