#!/bin/bash

# Script para configurar ambiente de staging
# Execute: chmod +x scripts/setup-staging-environment.sh && ./scripts/setup-staging-environment.sh

echo "🚀 CONFIGURANDO AMBIENTE DE STAGING"
echo "====================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

PROJECT_PATH=$(pwd)
echo "📁 Projeto: $PROJECT_PATH"
echo ""

# Passo 1: Configurar branches
echo "📋 PASSO 1: Configurando Branches Git"
echo "-------------------------------------"

# Verificar se git existe
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado"
    exit 1
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Branch atual: $CURRENT_BRANCH"

# Criar branch staging se não existir
if git rev-parse --verify staging >/dev/null 2>&1; then
    echo "✅ Branch 'staging' já existe"
else
    echo "🔧 Criando branch 'staging'..."
    git checkout -b staging
    git push -u origin staging
    echo "✅ Branch 'staging' criada e publicada"
fi

# Criar branch develop se não existir
if git rev-parse --verify develop >/dev/null 2>&1; then
    echo "✅ Branch 'develop' já existe"
else
    echo "🔧 Criando branch 'develop'..."
    git checkout -b develop
    git push -u origin develop
    echo "✅ Branch 'develop' criada e publicada"
fi

# Voltar para main
git checkout main
echo ""

# Passo 2: Configurar arquivos de ambiente
echo "📋 PASSO 2: Configurando Arquivos de Ambiente"
echo "----------------------------------------------"

# Backup do .env atual
if [ -f ".env" ]; then
    cp .env .env.production.backup
    echo "✅ Backup criado: .env.production.backup"
fi

# Criar .env.local para desenvolvimento
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local já existe"
    read -p "🤔 Sobrescrever? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Pulando criação do .env.local"
    else
        rm .env.local
    fi
fi

if [ ! -f ".env.local" ]; then
    echo "🔧 Criando .env.local..."
    cat > .env.local << 'EOF'
# DEVELOPMENT ENVIRONMENT
NODE_ENV="development"

# Database Configuration - STAGING
# SUBSTITUA pela URL do seu banco dropa-staging
DATABASE_URL="postgresql://postgres.staging:senha@staging-host.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.staging:senha@staging-host.supabase.co:5432/postgres"

# NextAuth - Development
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production-staging-env"

# OAuth Providers - Development Keys
GOOGLE_CLIENT_ID="dev-google-client-id"
GOOGLE_CLIENT_SECRET="dev-google-client-secret"

# Mercado Pago - SANDBOX (Teste)
MERCADO_PAGO_ACCESS_TOKEN="TEST-123456789-sandbox-token"
MERCADO_PAGO_PUBLIC_KEY="TEST-pub-key-sandbox"
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="TEST-pub-key-sandbox"
MERCADO_PAGO_WEBHOOK_SECRET="test-webhook-secret"

# Email - Development
RESEND_API_KEY="dev-resend-key"

# Cloudinary - Development
CLOUDINARY_CLOUD_NAME="dev-cloud-name"
CLOUDINARY_API_KEY="dev-api-key"
CLOUDINARY_API_SECRET="dev-api-secret"

# Backup Configuration
BACKUP_DIR="./backups"
BACKUP_ENCRYPTION_KEY="Dev-Backup-Key-2025-Staging-Environment"
BACKUP_RETENTION_DAYS="30"

# Feature Flags
ENABLE_REGISTRATION="true"
ENABLE_MARKETPLACE="true"
ENABLE_ACHIEVEMENTS="true"
MAINTENANCE_MODE="false"
EOF
    echo "✅ Arquivo .env.local criado"
    echo "⚠️  IMPORTANTE: Edite as URLs do banco de dados!"
fi

# Criar .env.staging para referência
if [ ! -f ".env.staging" ]; then
    echo "🔧 Criando .env.staging (referência)..."
    cp .env.local .env.staging
    sed -i 's/NEXTAUTH_URL="http:\/\/localhost:3000"/NEXTAUTH_URL="https:\/\/dropa-colecion-veis-staging.vercel.app"/g' .env.staging
    sed -i 's/NODE_ENV="development"/NODE_ENV="staging"/g' .env.staging
    echo "✅ Arquivo .env.staging criado"
fi

echo ""

# Passo 3: Adicionar scripts ao package.json
echo "📋 PASSO 3: Configurando Scripts NPM"
echo "------------------------------------"

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado"
    exit 1
fi

# Backup do package.json
cp package.json package.json.backup
echo "✅ Backup criado: package.json.backup"

# Adicionar scripts (usando node para modificar JSON)
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = pkg.scripts || {};

const newScripts = {
  'dev:staging': 'NODE_ENV=staging next dev',
  'db:migrate:staging': 'DATABASE_URL=\$STAGING_DATABASE_URL prisma migrate dev',
  'db:sync-staging': 'node scripts/sync-prod-to-staging.js',
  'db:reset-staging': 'node scripts/reset-staging-db.js',
  'backup:production': 'node scripts/backup-production.js',
  'env:status': 'node scripts/environment-status.js'
};

Object.assign(pkg.scripts, newScripts);

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Scripts adicionados ao package.json');
"

echo ""

# Passo 4: Criar scripts auxiliares
echo "📋 PASSO 4: Criando Scripts Auxiliares"
echo "--------------------------------------"

# Script de status dos ambientes
cat > scripts/environment-status.js << 'EOF'
#!/usr/bin/env node

console.log('📊 STATUS DOS AMBIENTES\n')

const environments = {
  'Local Dev': {
    url: 'http://localhost:3000',
    database: process.env.DATABASE_URL?.includes('staging') ? 'staging' : 'production',
    branch: 'local'
  },
  'Staging': {
    url: 'https://dropa-colecion-veis-staging.vercel.app',
    database: 'staging',
    branch: 'staging'
  },
  'Production': {
    url: 'https://dropa-colecion-veis.vercel.app',
    database: 'production',
    branch: 'main'
  }
}

Object.entries(environments).forEach(([name, config]) => {
  console.log(`🌐 ${name}:`)
  console.log(`   URL: ${config.url}`)
  console.log(`   Database: ${config.database}`)
  console.log(`   Branch: ${config.branch}`)
  console.log('')
})

console.log('🔧 COMANDOS ÚTEIS:')
console.log('   npm run dev              # Desenvolvimento local')
console.log('   npm run dev:staging      # Dev com env staging')
console.log('   npm run db:sync-staging  # Sincronizar dados')
console.log('   npm run backup           # Backup local')
console.log('   npm run env:status       # Este comando')
console.log('   git checkout staging     # Mudar para staging')
console.log('   git checkout main        # Mudar para produção')
EOF

chmod +x scripts/environment-status.js
echo "✅ Script environment-status.js criado"

# Atualizar .gitignore
echo ""
echo "📋 PASSO 5: Atualizando .gitignore"
echo "----------------------------------"

if [ ! -f ".gitignore" ]; then
    touch .gitignore
fi

# Adicionar entradas se não existirem
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF ".env.staging" .gitignore || echo ".env.staging" >> .gitignore
grep -qxF "*.backup" .gitignore || echo "*.backup" >> .gitignore

echo "✅ .gitignore atualizado"

echo ""
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo "=========================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣ EDITAR CONFIGURAÇÕES:"
echo "   📝 Edite .env.local com as URLs corretas do banco staging"
echo "   📝 Configure variáveis do Mercado Pago, Cloudinary, etc."
echo ""
echo "2️⃣ CONFIGURAR VERCEL STAGING:"
echo "   🌐 Acesse: dropa-colecion-veis-staging.vercel.app"
echo "   ⚙️  Configure as variáveis de ambiente"
echo "   🔗 Conecte com a branch 'staging'"
echo ""
echo "3️⃣ TESTAR AMBIENTE:"
echo "   🚀 npm run dev"
echo "   🔍 npm run env:status"
echo "   🔄 git checkout staging"
echo ""
echo "4️⃣ PRIMEIRO DEPLOY:"
echo "   📝 git add ."
echo "   💾 git commit -m \"feat: configurar ambiente staging\""
echo "   🚀 git push origin staging"
echo ""
echo "📚 DOCUMENTAÇÃO COMPLETA:"
echo "   📖 GUIA-SEPARACAO-AMBIENTES.md"
echo ""
echo "✅ AMBIENTE DE STAGING CONFIGURADO COM SUCESSO!"