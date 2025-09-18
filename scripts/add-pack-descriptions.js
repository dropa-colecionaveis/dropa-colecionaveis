#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPackDescriptions() {
  try {
    console.log('📝 Adicionando descrições aos pacotes...\n');

    const packUpdates = [
      {
        type: 'BRONZE',
        description: 'Um pacote básico com boa chance de itens comuns e incomuns'
      },
      {
        type: 'SILVER', 
        description: 'Um pacote intermediário com boas chances de itens'
      },
      {
        type: 'GOLD',
        description: 'Um pacote premium com maiores chances de itens raros'
      },
      {
        type: 'PLATINUM',
        description: 'Um pacote luxuoso com excelentes chances de itens épicos'
      },
      {
        type: 'DIAMOND',
        description: 'O pacote supremo com as melhores chances de itens lendários'
      }
    ];

    for (const update of packUpdates) {
      const result = await prisma.pack.updateMany({
        where: {
          type: update.type
        },
        data: {
          description: update.description
        }
      });

      console.log(`✅ ${update.type}: "${update.description}" (${result.count} pacote(s) atualizado(s))`);
    }

    // Corrigir o tipo do pacote Diamante se necessário
    const diamondPack = await prisma.pack.findFirst({
      where: {
        name: { contains: 'Diamante' },
        type: null
      }
    });

    if (diamondPack) {
      await prisma.pack.update({
        where: { id: diamondPack.id },
        data: {
          type: 'DIAMOND',
          description: 'O pacote supremo com as melhores chances de itens lendários'
        }
      });
      console.log('🔧 Tipo do Pacote Diamante corrigido');
    }

    // Verificar resultado
    console.log('\n📊 Verificação final:');
    const updatedPacks = await prisma.pack.findMany({
      select: {
        name: true,
        type: true,
        price: true,
        description: true
      },
      orderBy: { price: 'asc' }
    });

    updatedPacks.forEach(pack => {
      console.log(`\n💎 ${pack.name} (${pack.type}) - ${pack.price} créditos`);
      console.log(`   "${pack.description}"`);
    });

    console.log('\n✅ Descrições dos pacotes adicionadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPackDescriptions();