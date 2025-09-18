#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPackTypes() {
  try {
    console.log('📦 Adicionando tipos de pacotes customizados...\n');

    const packTypes = [
      {
        name: 'bronze',
        displayName: 'Bronze',
        emoji: '🥉',
        color: '#cd7f32',
        description: 'Pacote básico com boa chance de itens comuns e incomuns',
        isActive: true,
        isDefault: false
      },
      {
        name: 'silver',
        displayName: 'Prata',
        emoji: '🥈',
        color: '#c0c0c0',
        description: 'Pacote intermediário com melhor equilíbrio de raridades',
        isActive: true,
        isDefault: false
      },
      {
        name: 'gold',
        displayName: 'Ouro',
        emoji: '🥇',
        color: '#ffd700',
        description: 'Pacote premium com alta chance de itens raros',
        isActive: true,
        isDefault: true
      },
      {
        name: 'platinum',
        displayName: 'Platina',
        emoji: '💎',
        color: '#e5e4e2',
        description: 'Pacote de luxo com excelente chance de itens épicos',
        isActive: true,
        isDefault: false
      },
      {
        name: 'diamond',
        displayName: 'Diamante',
        emoji: '💠',
        color: '#b9f2ff',
        description: 'Pacote supremo com máxima chance de itens lendários',
        isActive: true,
        isDefault: false
      }
    ];

    console.log('🎨 Criando tipos de pacotes customizados...');
    
    for (const packType of packTypes) {
      const existing = await prisma.packTypeCustom.findUnique({
        where: { name: packType.name }
      });

      if (!existing) {
        const created = await prisma.packTypeCustom.create({
          data: packType
        });
        console.log(`✅ ${packType.displayName} (${packType.emoji}) - ${packType.description}`);

        // Atualizar o pacote correspondente para usar o customTypeId
        await prisma.pack.updateMany({
          where: {
            type: packType.name.toUpperCase()
          },
          data: {
            customTypeId: created.id
          }
        });
        console.log(`🔗 Pacote ${packType.displayName} vinculado ao tipo customizado`);
      } else {
        console.log(`⏭️ Tipo ${packType.displayName} já existe`);
      }
    }

    // Verificar resultado
    console.log('\n📊 Verificação final:');
    const totalPackTypes = await prisma.packTypeCustom.count();
    console.log(`   - Tipos de pacotes customizados: ${totalPackTypes}`);

    const packsWithCustomType = await prisma.pack.count({
      where: { customTypeId: { not: null } }
    });
    console.log(`   - Pacotes com tipo customizado: ${packsWithCustomType}`);

    // Listar todos os tipos criados
    const allTypes = await prisma.packTypeCustom.findMany({
      select: { name: true, displayName: true, emoji: true, color: true, isDefault: true }
    });

    console.log('\n🎨 Tipos de pacotes criados:');
    allTypes.forEach(type => {
      const defaultMark = type.isDefault ? ' (padrão)' : '';
      console.log(`   ${type.emoji} ${type.displayName} - ${type.color}${defaultMark}`);
    });

    console.log('\n✅ Tipos de pacotes customizados criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPackTypes();