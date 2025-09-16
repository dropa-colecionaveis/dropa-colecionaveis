#!/usr/bin/env node

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔄 SINCRONIZAÇÃO: PRODUÇÃO → STAGING')
console.log('====================================')
console.log('')

// Configurações
const PROD_URL = process.env.DATABASE_URL || process.env.PROD_DATABASE_URL
const STAGING_URL = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL

// URLs de exemplo (substitua pelas suas)
const EXAMPLE_PROD = "postgresql://postgres.mahzeczsuklpnqstqqug:M%4022te24uss@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
const EXAMPLE_STAGING = "postgresql://postgres.staging:senha@staging-host.supabase.co:5432/postgres"

function showUsage() {
  console.log('📋 USO DO SCRIPT:')
  console.log('')
  console.log('🔧 CONFIGURAR VARIÁVEIS DE AMBIENTE:')
  console.log('   export PROD_DATABASE_URL="sua-url-de-producao"')
  console.log('   export STAGING_DATABASE_URL="sua-url-de-staging"')
  console.log('')
  console.log('🚀 EXECUTAR:')
  console.log('   node scripts/sync-prod-to-staging.js')
  console.log('')
  console.log('📝 OU USAR npm:')
  console.log('   npm run db:sync-staging')
  console.log('')
  console.log('⚠️  IMPORTANTE:')
  console.log('   • Este script SOBRESCREVE todos os dados de staging')
  console.log('   • Faça backup antes se necessário')
  console.log('   • Confirme as URLs antes de executar')
}

function validateURLs() {
  if (!PROD_URL) {
    console.error('❌ URL de produção não configurada')
    console.error('   Configure: PROD_DATABASE_URL ou DATABASE_URL')
    return false
  }

  if (!STAGING_URL) {
    console.error('❌ URL de staging não configurada')
    console.error('   Configure: STAGING_DATABASE_URL')
    return false
  }

  if (PROD_URL === STAGING_URL) {
    console.error('❌ URLs de produção e staging são iguais!')
    console.error('   Risco de sobrescrever produção')
    return false
  }

  return true
}

async function confirmAction() {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    console.log('🔍 CONFIGURAÇÃO DETECTADA:')
    console.log(`   📊 Produção: ${PROD_URL.replace(/:[^:@]*@/, ':***@')}`)
    console.log(`   🧪 Staging:  ${STAGING_URL.replace(/:[^:@]*@/, ':***@')}`)
    console.log('')
    console.log('⚠️  ATENÇÃO: Dados de staging serão SOBRESCRITOS')
    console.log('')

    readline.question('❓ Continuar? (yes/N): ', (answer) => {
      readline.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

async function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 ${description}...`)
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro: ${error.message}`)
        reject(error)
        return
      }
      
      if (stderr) {
        console.log(`⚠️  ${stderr}`)
      }
      
      if (stdout) {
        console.log(`ℹ️  ${stdout}`)
      }
      
      console.log(`✅ ${description} concluído`)
      resolve()
    })
  })
}

async function syncDatabases() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = `temp-prod-backup-${timestamp}.sql`
    
    console.log('📋 PROCESSO DE SINCRONIZAÇÃO:')
    console.log('1️⃣ Backup da produção')
    console.log('2️⃣ Restauração no staging')
    console.log('3️⃣ Limpeza de arquivos temporários')
    console.log('')
    
    // Passo 1: Backup da produção
    const backupCommand = `pg_dump "${PROD_URL}" --verbose --no-owner --no-privileges --format=custom --file="${backupFile}"`
    
    await executeCommand(backupCommand, 'Fazendo backup da produção')
    
    // Verificar se arquivo foi criado
    if (!fs.existsSync(backupFile)) {
      throw new Error('Arquivo de backup não foi criado')
    }
    
    const fileSize = fs.statSync(backupFile).size
    console.log(`📊 Tamanho do backup: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)
    console.log('')
    
    // Passo 2: Restauração no staging
    const restoreCommand = `pg_restore --verbose --clean --no-acl --no-owner -d "${STAGING_URL}" "${backupFile}"`
    
    await executeCommand(restoreCommand, 'Restaurando no staging')
    
    // Passo 3: Limpeza
    console.log('🧹 Limpando arquivos temporários...')
    fs.unlinkSync(backupFile)
    console.log('✅ Limpeza concluída')
    
    console.log('')
    console.log('🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('')
    console.log('📋 PRÓXIMOS PASSOS:')
    console.log('   🔍 Verificar dados no staging')
    console.log('   🚀 Testar aplicação: npm run dev')
    console.log('   📊 Status: npm run env:status')
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message)
    console.log('')
    console.log('🔧 POSSÍVEIS SOLUÇÕES:')
    console.log('   • Verificar se pg_dump está instalado')
    console.log('   • Confirmar conectividade com os bancos')
    console.log('   • Verificar permissões de acesso')
    console.log('   • Confirmar URLs de conexão')
    process.exit(1)
  }
}

async function main() {
  // Verificar argumentos
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage()
    return
  }

  // Validar configuração
  if (!validateURLs()) {
    console.log('')
    showUsage()
    process.exit(1)
  }

  // Confirmar ação
  const confirmed = await confirmAction()
  if (!confirmed) {
    console.log('❌ Operação cancelada')
    process.exit(0)
  }

  // Executar sincronização
  await syncDatabases()
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { syncDatabases }