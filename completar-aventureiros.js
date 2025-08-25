const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function completarColecaoAventureiros() {
  try {
    console.log('🔍 Verificando coleção Aventureiros Clássicos...')
    
    // Buscar a coleção
    const colecao = await prisma.collection.findUnique({
      where: { name: 'Aventureiros Clássicos' },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' }
        }
      }
    })

    if (!colecao) {
      console.log('❌ Coleção Aventureiros Clássicos não encontrada!')
      return
    }

    console.log(`📦 Coleção encontrada: ${colecao.items.length}/25 itens`)

    if (colecao.items.length >= 25) {
      console.log('✅ Coleção já está completa!')
      return
    }

    // Encontrar próximo número disponível
    const ultimoNumero = Math.max(...colecao.items.map(item => item.itemNumber || 0))
    let proximoNumero = ultimoNumero + 1

    // Itens faltando para completar
    const itensParaCriar = [
      {
        name: 'Grimório Ancestral',
        description: 'Livro de magias antigas contendo feitiços perdidos no tempo',
        rarity: 'LENDARIO',
        value: 500,
        itemNumber: proximoNumero++
      },
      {
        name: 'Pergaminho do Teletransporte',
        description: 'Permite viagem instantânea para qualquer local conhecido',
        rarity: 'EPICO', 
        value: 100,
        itemNumber: proximoNumero++
      },
      {
        name: 'Mochila do Aventureiro',
        description: 'Bolsa mágica com espaço ilimitado para carregar itens',
        rarity: 'RARO',
        value: 40,
        itemNumber: proximoNumero++
      }
    ]

    console.log('🎯 Criando itens faltantes...')

    for (const novoItem of itensParaCriar) {
      if (colecao.items.length + (proximoNumero - ultimoNumero - 1) < 25) {
        const itemCriado = await prisma.item.create({
          data: {
            name: novoItem.name,
            description: novoItem.description,
            imageUrl: `/uploads/items/${novoItem.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
            rarity: novoItem.rarity,
            value: novoItem.value,
            collectionId: colecao.id,
            itemNumber: novoItem.itemNumber,
            isActive: true
          }
        })
        console.log(`✅ ${novoItem.itemNumber}. ${itemCriado.name} (${itemCriado.rarity}) - criado`)
      }
    }

    // Verificação final
    const colecaoFinal = await prisma.collection.findUnique({
      where: { id: colecao.id },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' }
        }
      }
    })

    console.log('\n🎉 COLEÇÃO COMPLETADA!')
    console.log('═══════════════════════════════════')
    console.log(`📚 ${colecaoFinal.name}`)
    console.log(`📦 Total final: ${colecaoFinal.items.length}/25 itens`)
    
    // Nova distribuição por raridade
    const distribuicao = {}
    colecaoFinal.items.forEach(item => {
      distribuicao[item.rarity] = (distribuicao[item.rarity] || 0) + 1
    })

    console.log('\n📊 Distribuição Final por Raridade:')
    Object.entries(distribuicao).forEach(([raridade, quantidade]) => {
      const emoji = {
        'COMUM': '🔘',
        'INCOMUM': '🟢', 
        'RARO': '🔵',
        'EPICO': '🟣',
        'LENDARIO': '🟡'
      }[raridade] || '⚪'
      
      console.log(`   ${emoji} ${raridade}: ${quantidade} itens`)
    })

    console.log('\n📋 Últimos 3 Itens Adicionados:')
    const ultimosItens = colecaoFinal.items.slice(-3)
    ultimosItens.forEach(item => {
      const emoji = {
        'COMUM': '🔘',
        'INCOMUM': '🟢',
        'RARO': '🔵', 
        'EPICO': '🟣',
        'LENDARIO': '🟡'
      }[item.rarity] || '⚪'
      
      console.log(`   ${item.itemNumber}. ${emoji} ${item.name} (${item.value} créditos)`)
    })

  } catch (error) {
    console.error('❌ Erro ao completar coleção:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
completarColecaoAventureiros()