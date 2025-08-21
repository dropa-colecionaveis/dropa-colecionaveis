const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migração de temas...')

  // Primeiro, vamos criar os temas padrão
  const defaultThemes = [
    {
      name: 'medieval',
      displayName: 'Medieval',
      description: 'Temas medievais com cavaleiros, castelos e dragões',
      emoji: '⚔️',
      colorClass: 'from-amber-500/20 to-orange-500/20',
      borderClass: 'border-amber-500/30',
      isSystem: true
    },
    {
      name: 'fantasy',
      displayName: 'Fantasy',
      description: 'Mundo mágico com magos, elfos e criaturas místicas',
      emoji: '🧙‍♂️',
      colorClass: 'from-purple-500/20 to-pink-500/20',
      borderClass: 'border-purple-500/30',
      isSystem: true
    },
    {
      name: 'classic',
      displayName: 'Clássico',
      description: 'Itens clássicos e tradicionais',
      emoji: '💎',
      colorClass: 'from-blue-500/20 to-cyan-500/20',
      borderClass: 'border-blue-500/30',
      isSystem: true
    },
    {
      name: 'sci-fi',
      displayName: 'Ficção Científica',
      description: 'Futurismo, naves espaciais e tecnologia avançada',
      emoji: '🚀',
      colorClass: 'from-green-500/20 to-emerald-500/20',
      borderClass: 'border-green-500/30',
      isSystem: true
    },
    {
      name: 'modern',
      displayName: 'Moderno',
      description: 'Temas contemporâneos e urbanos',
      emoji: '🏢',
      colorClass: 'from-slate-500/20 to-gray-500/20',
      borderClass: 'border-slate-500/30',
      isSystem: true
    },
    {
      name: 'mythological',
      displayName: 'Mitológico',
      description: 'Deuses, titãs e criaturas da mitologia',
      emoji: '🐉',
      colorClass: 'from-yellow-500/20 to-red-500/20',
      borderClass: 'border-yellow-500/30',
      isSystem: true
    }
  ]

  console.log('📚 Criando temas padrão...')
  const themeMap = {}
  
  for (const themeData of defaultThemes) {
    const theme = await prisma.theme.upsert({
      where: { name: themeData.name },
      update: themeData,
      create: themeData
    })
    themeMap[themeData.name] = theme.id
    console.log(`✅ Tema criado: ${themeData.displayName}`)
  }

  // Agora vamos migrar as coleções existentes
  console.log('🔄 Migrando coleções existentes...')
  
  const collections = await prisma.collection.findMany()
  
  for (const collection of collections) {
    if (collection.theme) {
      const themeId = themeMap[collection.theme]
      if (themeId) {
        await prisma.collection.update({
          where: { id: collection.id },
          data: {
            themeId: themeId,
            theme: undefined // Remove the old field
          }
        })
        console.log(`✅ Coleção migrada: ${collection.name} -> ${collection.theme}`)
      } else {
        // Se o tema não existe nos padrão, usar como customTheme
        await prisma.collection.update({
          where: { id: collection.id },
          data: {
            customTheme: collection.theme,
            theme: undefined
          }
        })
        console.log(`✅ Coleção com tema customizado: ${collection.name} -> ${collection.theme}`)
      }
    }
  }

  console.log('🎉 Migração de temas concluída com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })