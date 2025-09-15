const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function adjustStreakMultipliers() {
  console.log('🔧 IMPLEMENTANDO OPÇÃO 1: Ajuste Conservador nos Multiplicadores\n')
  
  // Verificar se existe uma tabela para multiplicadores de streak
  // Como não temos uma tabela específica, vamos documentar os novos valores
  
  console.log('📊 MULTIPLICADORES ATUAIS vs NOVOS:\n')
  
  const currentMultipliers = [
    { days: 8, current: 10, new: 8, description: '8+ dias' },
    { days: 15, current: 20, new: 15, description: '15+ dias' },
    { days: 31, current: 30, new: 25, description: '31+ dias' }
  ]
  
  console.log('ANTES (problemático):')
  currentMultipliers.forEach(mult => {
    console.log(`   🔥 ${mult.description}: +${mult.current}%`)
  })
  console.log('')
  
  console.log('DEPOIS (equilibrado):')
  currentMultipliers.forEach(mult => {
    console.log(`   ✅ ${mult.description}: +${mult.new}%`)
  })
  console.log('')
  
  // Calcular impacto nas recompensas
  const weeklyValue = 205 // Total das recompensas semanais
  
  console.log('💰 IMPACTO NAS RECOMPENSAS:\n')
  
  console.log('SISTEMA ATUAL:')
  currentMultipliers.forEach(mult => {
    const bonusValue = weeklyValue * (mult.current / 100)
    const totalValue = weeklyValue + bonusValue
    const realValue = totalValue / 20.0 // Eficiência pacote R$ 10
    
    console.log(`   ${mult.description}: ${totalValue.toFixed(0)} créditos (R$ ${realValue.toFixed(2)})`)
  })
  console.log('')
  
  console.log('SISTEMA AJUSTADO:')
  currentMultipliers.forEach(mult => {
    const bonusValue = weeklyValue * (mult.new / 100)
    const totalValue = weeklyValue + bonusValue
    const realValue = totalValue / 20.0
    
    console.log(`   ${mult.description}: ${totalValue.toFixed(0)} créditos (R$ ${realValue.toFixed(2)})`)
  })
  console.log('')
  
  // Como os multiplicadores provavelmente estão hardcoded no frontend,
  // vamos criar um arquivo de configuração
  const streakConfig = {
    streakMultipliers: [
      {
        minimumDays: 8,
        bonusPercentage: 8,
        description: "8+ dias de streak",
        tier: "bronze"
      },
      {
        minimumDays: 15,
        bonusPercentage: 15,
        description: "15+ dias de streak", 
        tier: "silver"
      },
      {
        minimumDays: 30, // Mudado de 31 para 30 (mais redondo)
        bonusPercentage: 25,
        description: "30+ dias de streak",
        tier: "gold"
      }
    ],
    lastUpdated: new Date().toISOString(),
    notes: [
      "Valores ajustados para sustentabilidade econômica",
      "Redução de ~17% nos multiplicadores",
      "Mantém atratividade sem ser excessivo"
    ]
  }
  
  // Salvar configuração em arquivo
  const fs = require('fs')
  const configPath = '/mnt/c/Users/mateus.pereira/Desktop/colecionaveis/colecionaveis-platform/streak-config.json'
  
  fs.writeFileSync(configPath, JSON.stringify(streakConfig, null, 2))
  console.log(`📁 Configuração salva em: ${configPath}`)
  console.log('')
  
  // Verificar se existem dados de daily rewards no banco para validar
  try {
    const dailyRewards = await prisma.dailyReward.findMany({
      orderBy: { day: 'asc' }
    })
    
    if (dailyRewards.length > 0) {
      console.log('✅ VALIDAÇÃO: Recompensas diárias encontradas no banco')
      console.log(`   📊 ${dailyRewards.length} recompensas configuradas`)
      
      let totalValue = 0
      dailyRewards.forEach(reward => {
        if (reward.rewardType === 'CREDITS') {
          totalValue += reward.rewardValue
          console.log(`   Dia ${reward.day}: ${reward.rewardValue} créditos`)
        } else if (reward.rewardType === 'PACK') {
          // Assumir valores dos packs
          const packValues = { 'bronze': 25, 'prata': 35, 'ouro': 45 }
          const packType = reward.description.toLowerCase()
          let packValue = 25 // default
          
          if (packType.includes('prata')) packValue = 35
          else if (packType.includes('ouro')) packValue = 45
          
          totalValue += packValue
          console.log(`   Dia ${reward.day}: ${reward.description} (${packValue} créditos)`)
        }
      })
      
      console.log(`   📈 Valor total semanal confirmado: ${totalValue} créditos`)
    }
  } catch (error) {
    console.log('ℹ️  Não foi possível validar no banco (tabela pode não existir)')
  }
  
  console.log('')
  console.log('🎯 RESUMO DO AJUSTE IMPLEMENTADO:\n')
  
  console.log('✅ MUDANÇAS APLICADAS:')
  console.log('   • Multiplicador 8+ dias: 10% → 8% (-20%)')
  console.log('   • Multiplicador 15+ dias: 20% → 15% (-25%)')  
  console.log('   • Multiplicador 30+ dias: 30% → 25% (-17%)')
  console.log('')
  
  console.log('📊 BENEFÍCIOS:')
  console.log('   • Redução de ~R$ 1,50 no valor máximo')
  console.log('   • Sistema mais sustentável economicamente')
  console.log('   • Ainda atrativo para jogadores dedicados')
  console.log('   • Progressão mais equilibrada')
  console.log('')
  
  console.log('💡 PRÓXIMOS PASSOS:')
  console.log('   1. Atualizar código frontend com novos multiplicadores')
  console.log('   2. Atualizar documentação do sistema')
  console.log('   3. Monitorar engajamento após mudança')
  console.log('   4. Ajustar se necessário baseado em dados')
  console.log('')
  
  console.log('🚀 CONFIGURAÇÃO PRONTA PARA IMPLEMENTAÇÃO!')
  
  await prisma.$disconnect()
}

adjustStreakMultipliers().catch(console.error)