const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeFreePackSystem() {
  console.log('🎁 ANÁLISE DETALHADA: Sistema de Pacote Gratuito para Novos Usuários\n')
  
  // Buscar dados do sistema atual
  console.log('📊 COLETANDO DADOS DO SISTEMA...\n')
  
  try {
    // Verificar quais packs existem
    const allPacks = await prisma.pack.findMany({
      where: { isActive: true },
      include: { 
        probabilities: true,
        customType: true 
      },
      orderBy: { price: 'asc' }
    })
    
    console.log('📦 PACOTES DISPONÍVEIS NO SISTEMA:')
    allPacks.forEach(pack => {
      console.log(`   ${pack.name}: ${pack.price} créditos`)
    })
    console.log('')
    
    // Verificar grants de pacotes gratuitos
    const freePackGrants = await prisma.freePackGrant.findMany({
      include: {
        pack: {
          include: { probabilities: true }
        },
        user: {
          select: { id: true, email: true, createdAt: true }
        }
      }
    })
    
    console.log(`🎁 PACOTES GRATUITOS CONCEDIDOS: ${freePackGrants.length}`)
    if (freePackGrants.length > 0) {
      console.log('   📋 Últimos grants:')
      freePackGrants.slice(-5).forEach(grant => {
        console.log(`      ${grant.pack.name} para ${grant.user.email} - ${grant.claimed ? 'Coletado' : 'Pendente'}`)
      })
    }
    console.log('')
    
    // Verificar hasReceivedFreePack nos usuários
    const usersWithFreePack = await prisma.user.count({
      where: { hasReceivedFreePack: true }
    })
    
    const totalUsers = await prisma.user.count()
    
    console.log(`👥 USUÁRIOS E PACOTES GRATUITOS:`)
    console.log(`   📊 Total de usuários: ${totalUsers}`)
    console.log(`   🎁 Usuários que receberam pack gratuito: ${usersWithFreePack}`)
    console.log(`   📈 Percentual: ${totalUsers > 0 ? ((usersWithFreePack / totalUsers) * 100).toFixed(1) : 0}%`)
    console.log('')
    
  } catch (error) {
    console.log('⚠️  Erro ao buscar dados:', error.message)
  }
  
  // Análise dos valores dos packs e qual seria ideal para novos usuários
  console.log('🎯 ANÁLISE: Qual Pack é Ideal para Novos Usuários?\n')
  
  const packAnalysis = {
    'Pacote Bronze': {
      price: 25,
      realCost: 1.25,
      probabilities: {
        COMUM: 60,
        INCOMUM: 25,
        RARO: 10,
        EPICO: 4,
        LENDARIO: 1
      },
      pros: ['Baixo custo', 'Boa chance de itens úteis', 'Não quebra economia'],
      cons: ['Baixa chance de itens raros', 'Pode frustrar alguns usuários']
    },
    'Pacote Prata': {
      price: 35,
      realCost: 1.75,
      probabilities: {
        COMUM: 48,
        INCOMUM: 30,
        RARO: 16,
        EPICO: 4,
        LENDARIO: 2
      },
      pros: ['Bom equilíbrio', 'Maior chance de raros', 'Boa primeira impressão'],
      cons: ['Custo moderado', 'Pode ser muito generoso']
    },
    'Pacote Ouro': {
      price: 45,
      realCost: 2.25,
      probabilities: {
        COMUM: 35,
        INCOMUM: 32,
        RARO: 22,
        EPICO: 8,
        LENDARIO: 3
      },
      pros: ['Muito atrativo', 'Alta chance de bons itens', 'Excelente primeira impressão'],
      cons: ['Custo alto', 'Muito generoso', 'Pode viciar em packs premium']
    }
  }
  
  // Valores médios por raridade (do sistema atual)
  const rarityValues = {
    COMUM: 13,
    INCOMUM: 24,
    RARO: 37,
    EPICO: 67,
    LENDARIO: 351
  }
  
  console.log('💰 ANÁLISE DETALHADA POR PACK:\n')
  
  Object.entries(packAnalysis).forEach(([packName, analysis]) => {
    console.log(`📦 ${packName}:`)
    console.log(`   💸 Custo real: R$ ${analysis.realCost}`)
    console.log(`   💰 Preço em créditos: ${analysis.price}`)
    
    // Calcular valor esperado
    let expectedValue = 0
    Object.entries(analysis.probabilities).forEach(([rarity, prob]) => {
      expectedValue += (prob / 100) * rarityValues[rarity]
    })
    
    const roi = ((expectedValue / analysis.price) * 100).toFixed(1)
    
    console.log(`   📊 Valor esperado: ${expectedValue.toFixed(1)} créditos`)
    console.log(`   🎯 ROI: ${roi}%`)
    
    console.log(`   ✅ Prós:`)
    analysis.pros.forEach(pro => console.log(`      • ${pro}`))
    
    console.log(`   ⚠️  Contras:`)
    analysis.cons.forEach(con => console.log(`      • ${con}`))
    
    console.log('')
  })
  
  // Análise de impacto no onboarding
  console.log('🚀 ANÁLISE: Impacto no Onboarding de Usuários\n')
  
  const onboardingScenarios = [
    {
      pack: 'Bronze',
      userExperience: 'Conservadora',
      description: 'Usuário recebe itens básicos, entende o sistema gradualmente',
      conversionRate: 'Média',
      economicImpact: 'Baixo',
      recommendation: 'Seguro para volume alto de usuários'
    },
    {
      pack: 'Prata', 
      userExperience: 'Equilibrada',
      description: 'Usuário tem boa primeira impressão, vê potencial do jogo',
      conversionRate: 'Alta',
      economicImpact: 'Moderado',
      recommendation: 'Ideal para maioria dos casos'
    },
    {
      pack: 'Ouro',
      userExperience: 'Premium',
      description: 'Usuário fica impressionado, quer continuar jogando',
      conversionRate: 'Muito Alta',
      economicImpact: 'Alto',
      recommendation: 'Para campanhas especiais ou usuários VIP'
    }
  ]
  
  onboardingScenarios.forEach(scenario => {
    console.log(`🎯 CENÁRIO ${scenario.pack.toUpperCase()}:`)
    console.log(`   🎮 Experiência: ${scenario.userExperience}`)
    console.log(`   📝 Descrição: ${scenario.description}`)
    console.log(`   📈 Taxa de conversão: ${scenario.conversionRate}`)
    console.log(`   💸 Impacto econômico: ${scenario.economicImpact}`)
    console.log(`   💡 Recomendação: ${scenario.recommendation}`)
    console.log('')
  })
  
  // Verificar configuração atual no código
  console.log('🔍 VERIFICAÇÃO: Configuração Atual do Sistema\n')
  
  try {
    // Buscar um usuário exemplo para ver a configuração
    const sampleUser = await prisma.user.findFirst({
      select: {
        hasReceivedFreePack: true,
        freePackGrants: {
          include: {
            pack: {
              include: { probabilities: true }
            }
          }
        }
      }
    })
    
    if (sampleUser && sampleUser.freePackGrants.length > 0) {
      const freePack = sampleUser.freePackGrants[0].pack
      console.log(`✅ PACK GRATUITO CONFIGURADO: ${freePack.name}`)
      console.log(`   💰 Valor: ${freePack.price} créditos`)
      console.log(`   🎲 Probabilidades:`)
      freePack.probabilities.forEach(prob => {
        console.log(`      ${prob.rarity}: ${prob.percentage}%`)
      })
    } else {
      console.log('ℹ️  Nenhum pack gratuito encontrado nos registros')
    }
  } catch (error) {
    console.log('ℹ️  Não foi possível verificar configuração atual')
  }
  
  console.log('')
  
  // Recomendação final baseada na análise
  console.log('🏆 RECOMENDAÇÃO FINAL:\n')
  
  console.log('📊 BASEADO NA ANÁLISE COMPLETA:')
  console.log('')
  console.log('🥉 BRONZE - Para volume alto:')
  console.log('   • Custo baixo (R$ 1,25)')
  console.log('   • Sustentável economicamente')
  console.log('   • Boa para testes A/B')
  console.log('')
  console.log('🥈 PRATA - RECOMENDADO:')
  console.log('   • Custo moderado (R$ 1,75)')
  console.log('   • Excelente primeira impressão')
  console.log('   • ROI atrativo (83%)')
  console.log('   • 16% chance de raro + 6% chance de épico/lendário')
  console.log('')
  console.log('🥇 OURO - Para eventos especiais:')
  console.log('   • Custo alto (R$ 2,25)')
  console.log('   • Muito atrativo')
  console.log('   • Para campanhas premium')
  console.log('')
  
  console.log('💡 ESTRATÉGIA SUGERIDA:')
  console.log('   1. PADRÃO: Pack Prata para novos usuários')
  console.log('   2. ESPECIAL: Pack Ouro para campanhas/eventos')
  console.log('   3. ECONÔMICO: Pack Bronze para testes de volume')
  console.log('')
  
  console.log('🔧 IMPLEMENTAÇÃO RECOMENDADA:')
  console.log('   • Pack gratuito: PRATA')
  console.log('   • Sistema flexível para alterar durante eventos')
  console.log('   • Tracking de conversão por tipo de pack')
  console.log('   • A/B testing para otimizar')
  
  await prisma.$disconnect()
}

analyzeFreePackSystem().catch(console.error)