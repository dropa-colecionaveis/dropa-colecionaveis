const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function organizarItensExistentes() {
  try {
    console.log('🔍 Analisando itens existentes sem coleção...')
    
    // 1. Buscar itens sem coleção
    const itensSemColecao = await prisma.item.findMany({
      where: {
        collectionId: null
      },
      orderBy: [
        { rarity: 'desc' }, // Lendário primeiro
        { name: 'asc' }
      ]
    })

    console.log(`📦 Encontrados ${itensSemColecao.length} itens sem coleção`)

    if (itensSemColecao.length === 0) {
      console.log('✅ Todos os itens já estão organizados em coleções!')
      return
    }

    // 2. Criar tema para "Aventureiros Clássicos"
    let temaAventureiros = await prisma.theme.findUnique({
      where: { name: 'aventureiros-classicos' }
    })

    if (!temaAventureiros) {
      temaAventureiros = await prisma.theme.create({
        data: {
          name: 'aventureiros-classicos',
          displayName: 'Aventureiros Clássicos',
          description: 'Equipamentos e itens essenciais para todo aventureiro de taverna',
          emoji: '🗡️',
          colorClass: 'from-amber-500/20 to-orange-600/20',
          borderClass: 'border-amber-500/30',
          isActive: true,
          isSystem: false
        }
      })
      console.log('✅ Tema criado: Aventureiros Clássicos')
    }

    // 3. Criar coleção "Aventureiros Clássicos"
    let colecaoAventureiros = await prisma.collection.findUnique({
      where: { name: 'Aventureiros Clássicos' }
    })

    if (!colecaoAventureiros) {
      colecaoAventureiros = await prisma.collection.create({
        data: {
          name: 'Aventureiros Clássicos',
          description: 'A coleção essencial de todo aventureiro! Desde poções básicas até armas lendárias que moldaram a história dos heróis.',
          themeId: temaAventureiros.id,
          maxItems: 25,
          isActive: true,
          isLimited: false
        }
      })
      console.log('📚 Coleção criada: Aventureiros Clássicos')
    }

    // 4. Mapear itens existentes com numeração sequencial
    console.log('🔗 Vinculando itens existentes à coleção...')
    
    // Separar por raridade para organizar melhor a numeração
    const raridades = ['COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO']
    let itemNumber = 1

    for (const raridade of raridades) {
      const itensRaridade = itensSemColecao.filter(item => item.rarity === raridade)
      
      for (const item of itensRaridade) {
        await prisma.item.update({
          where: { id: item.id },
          data: {
            collectionId: colecaoAventureiros.id,
            itemNumber: itemNumber
          }
        })
        console.log(`   ${itemNumber}. ${item.name} (${item.rarity}) - vinculado`)
        itemNumber++
      }
    }

    // 5. Verificar quantos itens faltam para completar 25
    const itensVinculados = await prisma.item.count({
      where: { collectionId: colecaoAventureiros.id }
    })

    const itensFaltando = 25 - itensVinculados
    console.log(`📊 Itens na coleção: ${itensVinculados}/25`)
    console.log(`📝 Faltam ${itensFaltando} itens para completar a coleção`)

    // 6. Criar os itens faltando (baseado nos existentes, devem ser 3)
    if (itensFaltando > 0) {
      console.log('🎯 Criando itens adicionais para completar a coleção...')
      
      const novosItens = [
        {
          name: 'Grimório Ancestral',
          description: 'Livro de magias antigas contendo feitiços perdidos no tempo',
          rarity: 'LENDARIO',
          value: 500,
          itemNumber: itemNumber++
        },
        {
          name: 'Pergaminho do Teletransporte',
          description: 'Permite viagem instantânea para qualquer local conhecido',
          rarity: 'EPICO', 
          value: 100,
          itemNumber: itemNumber++
        },
        {
          name: 'Mochila do Aventureiro',
          description: 'Bolsa mágica com espaço ilimitado para carregar itens',
          rarity: 'RARO',
          value: 40,
          itemNumber: itemNumber++
        }
      ]

      for (const novoItem of novosItens) {
        if (itemNumber <= 25) {
          await prisma.item.create({
            data: {
              name: novoItem.name,
              description: novoItem.description,
              imageUrl: `/uploads/items/${novoItem.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
              rarity: novoItem.rarity,
              value: novoItem.value,
              collectionId: colecaoAventureiros.id,
              itemNumber: novoItem.itemNumber,
              isActive: true
            }
          })
          console.log(`   ${novoItem.itemNumber}. ${novoItem.name} (${novoItem.rarity}) - criado`)
        }
      }
    }

    // 7. Verificação final
    const itensFinais = await prisma.item.findMany({
      where: { collectionId: colecaoAventureiros.id },
      orderBy: { itemNumber: 'asc' }
    })

    console.log('\n🎉 ORGANIZAÇÃO COMPLETA!')
    console.log('═══════════════════════════════════')
    console.log(`📚 Coleção: ${colecaoAventureiros.name}`)
    console.log(`🎨 Tema: ${temaAventureiros.displayName} ${temaAventureiros.emoji}`)
    console.log(`📦 Total de itens: ${itensFinais.length}/25`)
    console.log('═══════════════════════════════════')

    // Mostrar distribuição por raridade
    const distribuicao = {}
    itensFinais.forEach(item => {
      distribuicao[item.rarity] = (distribuicao[item.rarity] || 0) + 1
    })

    console.log('\n📊 Distribuição por Raridade:')
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

    console.log('\n📋 Lista Completa de Itens:')
    itensFinais.forEach(item => {
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
    console.error('❌ Erro ao organizar itens:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar organização
organizarItensExistentes()