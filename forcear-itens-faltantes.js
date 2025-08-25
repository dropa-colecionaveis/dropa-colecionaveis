const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function forcarCriacaoItensFaltantes() {
  try {
    console.log('🔍 Buscando coleção Aventureiros Clássicos...')
    
    const colecao = await prisma.collection.findUnique({
      where: { name: 'Aventureiros Clássicos' }
    })

    if (!colecao) {
      console.log('❌ Coleção não encontrada!')
      return
    }

    // Contar itens atuais
    const countAtual = await prisma.item.count({
      where: { collectionId: colecao.id }
    })

    console.log(`📦 Itens atuais na coleção: ${countAtual}`)

    // Criar os 3 itens faltantes diretamente
    const novosItens = [
      {
        name: 'Grimório Ancestral',
        description: 'Livro de magias antigas contendo feitiços perdidos no tempo',
        rarity: 'LENDARIO',
        value: 500,
        itemNumber: 23
      },
      {
        name: 'Pergaminho do Teletransporte', 
        description: 'Permite viagem instantânea para qualquer local conhecido',
        rarity: 'EPICO',
        value: 100,
        itemNumber: 24
      },
      {
        name: 'Mochila do Aventureiro',
        description: 'Bolsa mágica com espaço ilimitado para carregar itens',
        rarity: 'RARO',
        value: 40,
        itemNumber: 25
      }
    ]

    console.log('🎯 Criando os 3 itens faltantes...')

    for (const item of novosItens) {
      try {
        // Verificar se já existe
        const existe = await prisma.item.findFirst({
          where: {
            name: item.name,
            collectionId: colecao.id
          }
        })

        if (existe) {
          console.log(`⚠️  Item "${item.name}" já existe`)
          continue
        }

        const itemCriado = await prisma.item.create({
          data: {
            name: item.name,
            description: item.description,
            imageUrl: `/uploads/items/${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
            rarity: item.rarity,
            value: item.value,
            collectionId: colecao.id,
            itemNumber: item.itemNumber,
            isActive: true
          }
        })

        console.log(`✅ ${item.itemNumber}. ${itemCriado.name} (${itemCriado.rarity}) - ${itemCriado.value} créditos`)

      } catch (error) {
        console.error(`❌ Erro criando item "${item.name}":`, error.message)
      }
    }

    // Verificação final completa
    const itensFinal = await prisma.item.findMany({
      where: { collectionId: colecao.id },
      orderBy: { itemNumber: 'asc' }
    })

    console.log('\n🎉 RESULTADO FINAL!')
    console.log('═══════════════════════════════════')
    console.log(`📚 Coleção: Aventureiros Clássicos`)
    console.log(`📦 Total de itens: ${itensFinal.length}/25`)
    console.log('═══════════════════════════════════')

    // Distribuição detalhada
    const contadorRaridade = {
      'COMUM': 0,
      'INCOMUM': 0, 
      'RARO': 0,
      'EPICO': 0,
      'LENDARIO': 0
    }

    itensFinal.forEach(item => {
      contadorRaridade[item.rarity]++
    })

    console.log('\n📊 Distribuição por Raridade:')
    Object.entries(contadorRaridade).forEach(([raridade, count]) => {
      const emoji = {
        'COMUM': '🔘',
        'INCOMUM': '🟢',
        'RARO': '🔵',
        'EPICO': '🟣', 
        'LENDARIO': '🟡'
      }[raridade]
      console.log(`   ${emoji} ${raridade}: ${count} itens`)
    })

    // Listar todos os itens se a coleção estiver completa
    if (itensFinal.length === 25) {
      console.log('\n📋 COLEÇÃO COMPLETA - Lista de Todos os Itens:')
      itensFinal.forEach(item => {
        const emoji = {
          'COMUM': '🔘',
          'INCOMUM': '🟢',
          'RARO': '🔵',
          'EPICO': '🟣',
          'LENDARIO': '🟡'
        }[item.rarity]
        console.log(`   ${item.itemNumber}. ${emoji} ${item.name} (${item.value} créditos)`)
      })
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forcarCriacaoItensFaltantes()