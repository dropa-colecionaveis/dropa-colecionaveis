const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Sistema de Nomenclatura Gênesis em Português
// Tema: Criação do universo digital/físico

const genesisNames = {
  // 🟫 COMUNS (30 itens) - Elementos básicos da criação
  COMUM: {
    COMMON: [
      // Elementos digitais primordiais (20 itens)
      'Fragmento de Código Gênesis',
      'Pixel Primordial Gênesis', 
      'Bit da Origem Gênesis',
      'Byte Fundamental Gênesis',
      'Linha de Comando Gênesis',
      'Variável Básica Gênesis',
      'Função Simples Gênesis',
      'Loop Inicial Gênesis',
      'Condição Primária Gênesis',
      'Operador Base Gênesis',
      'String Primeira Gênesis',
      'Array Nascente Gênesis',
      'Objeto Raiz Gênesis',
      'Método Original Gênesis',
      'Classe Inaugural Gênesis',
      'Algoritmo Embrião Gênesis',
      'Estrutura Inicial Gênesis',
      'Ponteiro Primeiro Gênesis',
      'Memória Primordial Gênesis',
      'Cache Fundamental Gênesis'
    ],
    RARE: [
      // Elementos naturais básicos (10 itens) 
      'Grão de Areia Gênesis',
      'Gota de Chuva Gênesis',
      'Folha Nascente Gênesis', 
      'Graveto Primeiro Gênesis',
      'Semente Inicial Gênesis',
      'Cristal Menor Gênesis',
      'Pedra Simples Gênesis',
      'Fibra Natural Gênesis',
      'Broto Primário Gênesis',
      'Partícula Base Gênesis'
    ]
  },

  // 🟢 INCOMUNS (25 itens) - Ferramentas e objetos do desenvolvimento
  INCOMUM: {
    UNCOMMON: [
      // Ferramentas básicas (10 itens)
      'Flauta da Aurora Gênesis',
      'Frasco Ancestral Gênesis', 
      'Kit Herbal Gênesis',
      'Isqueiro Antigo Gênesis',
      'Jarra de Barro Gênesis',
      'Kit do Pescador Gênesis',
      'Lupa Reveladora Gênesis',
      'Moeda do Início Gênesis',
      'Partitura Sagrada Gênesis',
      'Óculos da Sabedoria Gênesis'
    ],
    RARE: [
      // Acessórios e utensílios (15 itens)
      'Bandana Colorida Gênesis',
      'Cinto da Força Gênesis', 
      'Dedal Encantado Gênesis',
      'Envelope Selado Gênesis',
      'Fivela Reluzente Gênesis',
      'Pena da Fênix Gênesis',
      'Quadro Ancestral Gênesis',
      'Remo Dourado Gênesis',
      'Sino de Prata Gênesis',
      'Tinta Especial Gênesis',
      'Traje Base Gênesis',
      'Vela Aromática Gênesis',
      'Apito Mágico Gênesis',
      'Licor Raro Gênesis',
      'Ioiô Encantado Gênesis'
    ]
  },

  // 🔵 RAROS (25 itens) - Artefatos místicos
  RARO: {
    LEGENDARY: [
      'Amuleto dos Ancestrais Gênesis',
      'Bússola Mística Gênesis',
      'Chave dos Mistérios Gênesis', 
      'Diário dos Fundadores Gênesis',
      'Espelho da Verdade Gênesis',
      'Frasco da Essência Gênesis',
      'Globo Cristalino Gênesis',
      'Harpa Celestial Gênesis',
      'Ídolo Dourado Gênesis',
      'Joia da Sabedoria Gênesis',
      'Kit do Alquimista Gênesis',
      'Lâmpada do Gênio Gênesis',
      'Mapa do Tesouro Gênesis',
      'Núcleo de Energia Gênesis',
      'Ovo do Dragão Gênesis',
      'Pedra Filosofal Gênesis',
      'Quartzo Rosa Gênesis',
      'Relógio Temporal Gênesis',
      'Selo do Imperador Gênesis',
      'Tocha Eterna Gênesis',
      'Urna Sagrada Gênesis',
      'Vidro Espiritual Gênesis',
      'Xale Protetor Gênesis',
      'Lâmina Yakuza Gênesis',
      'Zepelim em Miniatura Gênesis'
    ]
  },

  // 🟣 ÉPICOS (20 itens) - Equipamentos lendários
  EPICO: {
    MYTHIC: [
      'Espada dos Ancestrais Gênesis',
      'Escudo Primordial Gênesis',
      'Lança do Destino Gênesis',
      'Martelo dos Titãs Gênesis', 
      'Arco Celestial Gênesis',
      'Adaga das Sombras Gênesis',
      'Cetro Real Gênesis',
      'Orbe do Poder Gênesis',
      'Armadura Dracônica Gênesis',
      'Elmo Dourado Gênesis',
      'Botas Aladas Gênesis',
      'Luvas de Ferro Gênesis',
      'Anel da Sabedoria Gênesis',
      'Colar Místico Gênesis',
      'Pergaminho Antigo Gênesis',
      'Poção da Vida Gênesis',
      'Cristal de Mana Gênesis',
      'Gema do Tempo Gênesis',
      'Runas Sagradas Gênesis',
      'Talismã Protetor Gênesis'
    ]
  },

  // 🟡 LENDÁRIOS (10 itens) - Artefatos supremos
  LENDARIO: {
    LEGENDARY: [
      // Limitados 1000 exemplares (5 itens)
      'Espada Primordial do Gênesis',
      'Escudo da Eternidade Gênesis', 
      'Armadura dos Primórdios Gênesis',
      'Anel do Destino Original Gênesis',
      'Livro das Origens Gênesis'
    ],
    UNIQUE: [
      // Únicos (5 itens) - Os mais icônicos
      'Cristal do Gênesis',
      'Coroa Primordial Gênesis', 
      'Essência da Origem Gênesis',
      'Chave do Cosmos Gênesis',
      'Alma do Primeiro Gênesis'
    ]
  }
}

async function applyNewNames() {
  console.log('🔄 APLICANDO NOVO SISTEMA DE NOMES...')
  
  const genesisCollection = await prisma.collection.findFirst({
    where: { name: 'Genesis - Primeira Era' }
  })
  
  // Buscar itens por categoria
  const items = await prisma.item.findMany({
    where: { collectionId: genesisCollection.id },
    select: {
      id: true,
      name: true,
      rarity: true,
      scarcityLevel: true,
      isUnique: true,
      maxEditions: true
    },
    orderBy: [
      { rarity: 'asc' },
      { scarcityLevel: 'asc' },
      { name: 'asc' }
    ]
  })
  
  let nameIndex = {
    COMUM: { COMMON: 0, RARE: 0 },
    INCOMUM: { UNCOMMON: 0, RARE: 0 },
    RARO: { LEGENDARY: 0 },
    EPICO: { MYTHIC: 0 },
    LENDARIO: { LEGENDARY: 0, UNIQUE: 0 }
  }
  
  for (const item of items) {
    const rarity = item.rarity
    const scarcity = item.scarcityLevel
    
    // Determinar categoria especial para lendários
    let finalScarcity = scarcity
    if (rarity === 'LENDARIO') {
      finalScarcity = item.isUnique ? 'UNIQUE' : 'LEGENDARY'
    }
    
    const availableNames = genesisNames[rarity]?.[finalScarcity]
    
    if (availableNames && nameIndex[rarity][finalScarcity] < availableNames.length) {
      const newName = availableNames[nameIndex[rarity][finalScarcity]]
      
      await prisma.item.update({
        where: { id: item.id },
        data: { name: newName }
      })
      
      const type = item.isUnique ? '🌟' : item.maxEditions ? '🏆' : '📦'
      console.log(`   ${type} ${item.name} → ${newName}`)
      
      nameIndex[rarity][finalScarcity]++
    }
  }
  
  console.log('\\n✅ SISTEMA DE NOMES APLICADO!')
  console.log('🎯 CARACTERÍSTICAS:')
  console.log('   🇧🇷 100% em Português')
  console.log('   🌟 Tema Gênesis consistente')  
  console.log('   📈 Hierarquia por raridade')
  console.log('   🎮 Nomes icônicos para raros')
  
  await prisma.$disconnect()
}

applyNewNames().catch(console.error)