#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Usando bcryptjs que deve estar instalado

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetando senha do administrador...\n');
    
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updated = await prisma.user.update({
      where: {
        email: 'admin@admin.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Senha do administrador atualizada com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('   📧 Email: admin@admin.com');
    console.log('   🔑 Senha: admin123');
    console.log('   👤 Papel: SUPER_ADMIN');
    
    console.log('\n🌐 Para acessar o painel admin:');
    console.log('   1. Faça login com as credenciais acima');
    console.log('   2. Navegue para /admin ou /dashboard');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
    
    // Se der erro, vamos tentar criar um novo usuário admin
    console.log('\n🔄 Tentando criar novo usuário administrador...');
    
    try {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@admin.com',
          name: 'Super Admin',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          emailVerified: true
        }
      });
      
      console.log('✅ Novo usuário administrador criado!');
      console.log('   📧 Email: admin@admin.com');
      console.log('   🔑 Senha: admin123');
      
    } catch (createError) {
      console.error('❌ Erro ao criar usuário admin:', createError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();