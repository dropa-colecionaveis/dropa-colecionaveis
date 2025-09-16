# 🏗️ Guia Completo: Separação de Ambientes Dev/Staging/Produção

**Data:** 16/09/2025  
**Objetivo:** Separar ambientes para desenvolvimento seguro  
**Status:** Guia de Implementação Completo  

---

## 📋 Situação Atual vs. Ideal

### ❌ **SITUAÇÃO ATUAL (Problemática):**
```
Desenvolvimento Local → Banco "dropa" (Supabase)
Produção Vercel     → Banco "dropa" (Supabase)
```
**Problemas:**
- Mudanças de dev afetam produção
- Testes podem quebrar dados reais
- Rollback complexo
- Risco de corrupção de dados

### ✅ **SITUAÇÃO IDEAL (Objetivo):**
```
Desenvolvimento Local → Banco "dropa-staging" (Supabase)
Staging Vercel       → Banco "dropa-staging" (Supabase)
Produção Vercel      → Banco "dropa" (Supabase)
```

---

## 🎯 Arquitetura de Ambientes Recomendada

### **1. DESENVOLVIMENTO (Local)**
- **Banco:** `dropa-staging` (Supabase)
- **Branch:** `develop` ou `main` local
- **Propósito:** Desenvolvimento diário, testes locais

### **2. STAGING (Vercel)**
- **Banco:** `dropa-staging` (Supabase)
- **Branch:** `staging` → Deploy automático
- **URL:** `dropa-colecion-veis-staging.vercel.app`
- **Propósito:** Testes finais, homologação

### **3. PRODUÇÃO (Vercel)**
- **Banco:** `dropa` (Supabase)
- **Branch:** `main` → Deploy automático
- **URL:** `dropa-colecion-veis.vercel.app`
- **Propósito:** Ambiente live dos usuários

---

## 📚 PASSO 1: Configuração do Banco Staging

### **1.1 - Supabase: Configurar Banco Staging**

#### **Opção A: Usar banco existente "dropa-staging"**
```sql
-- Conectar no banco dropa-staging
-- Verificar se já existe
SELECT current_database();
```

#### **Opção B: Criar novo banco (se necessário)**
1. Acessar Supabase Dashboard
2. Criar novo projeto: `dropa-staging`
3. Copiar credenciais de conexão

### **1.2 - Copiar Dados de Produção para Staging**

```bash
# 1. Fazer backup do banco de produção
pg_dump "postgresql://postgres.mahzeczsuklpnqstqqug:M%4022te24uss@aws-1-sa-east-1.pooler.supabase.com:5432/postgres" \
  --verbose \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file="dropa-production-backup.sql"

# 2. Restaurar no banco de staging (substituir pela URL do staging)
pg_restore --verbose --clean --no-acl --no-owner \
  -h "sua-staging-host.supabase.co" \
  -p 5432 \
  -U postgres \
  -d postgres \
  "dropa-production-backup.sql"
```

---

## 📚 PASSO 2: Estratégia de Branches GitHub

### **2.1 - Estrutura de Branches Recomendada**

```
main (produção)
├── staging (homologação)
├── develop (desenvolvimento)
├── feature/nova-funcionalidade
├── hotfix/correcao-urgente
└── release/v1.2.0
```

### **2.2 - Configurar Branches**

```bash
# 1. Ir para o repositório local
cd /mnt/c/Users/mateus.pereira/Desktop/colecionaveis/colecionaveis-platform

# 2. Verificar branch atual
git branch

# 3. Criar e configurar branch staging
git checkout -b staging
git push -u origin staging

# 4. Criar e configurar branch develop (opcional)
git checkout -b develop
git push -u origin develop

# 5. Voltar para main
git checkout main
```

### **2.3 - Configurar Protection Rules no GitHub**

1. **Ir para:** `Settings > Branches` no GitHub
2. **Adicionar regras para `main`:**
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Restrict pushes

3. **Adicionar regras para `staging`:**
   - ✅ Require pull request reviews (opcional)
   - ✅ Allow force pushes (para testes)

---

## 📚 PASSO 3: Configuração de Variáveis de Ambiente

### **3.1 - Arquivo .env.local (Desenvolvimento)**

Criar arquivo `.env.local`:

```bash
# DEVELOPMENT ENVIRONMENT
NODE_ENV="development"

# Database Configuration - STAGING
DATABASE_URL="postgresql://postgres.staging:senha@staging-host.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.staging:senha@staging-host.supabase.co:5432/postgres"

# NextAuth - Development
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# OAuth Providers - Development Keys
GOOGLE_CLIENT_ID="dev-google-client-id"
GOOGLE_CLIENT_SECRET="dev-google-client-secret"

# Mercado Pago - SANDBOX (Teste)
MERCADO_PAGO_ACCESS_TOKEN="TEST-123456789-sandbox-token"
MERCADO_PAGO_PUBLIC_KEY="TEST-pub-key-sandbox"
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="TEST-pub-key-sandbox"

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
```

### **3.2 - Arquivo .env.staging**

Criar arquivo `.env.staging`:

```bash
# STAGING ENVIRONMENT
NODE_ENV="staging"

# Database Configuration - STAGING
DATABASE_URL="postgresql://postgres.staging:senha@staging-host.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.staging:senha@staging-host.supabase.co:5432/postgres"

# NextAuth - Staging
NEXTAUTH_URL="https://dropa-colecion-veis-staging.vercel.app"
NEXTAUTH_SECRET="staging-secret-different-from-prod"

# OAuth Providers - Development/Test Keys
GOOGLE_CLIENT_ID="staging-google-client-id"
GOOGLE_CLIENT_SECRET="staging-google-client-secret"

# Mercado Pago - SANDBOX (Teste)
MERCADO_PAGO_ACCESS_TOKEN="TEST-123456789-sandbox-token"
MERCADO_PAGO_PUBLIC_KEY="TEST-pub-key-sandbox"
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="TEST-pub-key-sandbox"

# Email - Staging
RESEND_API_KEY="staging-resend-key"

# Cloudinary - Staging
CLOUDINARY_CLOUD_NAME="staging-cloud-name"
CLOUDINARY_API_KEY="staging-api-key"
CLOUDINARY_API_SECRET="staging-api-secret"

# Feature Flags
ENABLE_REGISTRATION="true"
ENABLE_MARKETPLACE="true"
ENABLE_ACHIEVEMENTS="true"
MAINTENANCE_MODE="false"
```

### **3.3 - Arquivo .env (Produção)**

Manter o arquivo `.env` atual para produção.

---

## 📚 PASSO 4: Configuração da Vercel

### **4.1 - Projeto Staging na Vercel**

#### **Configurações do Projeto Staging:**

1. **Acessar:** `dropa-colecion-veis-staging` na Vercel
2. **Settings > Environment Variables**
3. **Configurar variáveis de staging:**

```
DATABASE_URL = postgresql://postgres.staging:senha@staging-host.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL = postgresql://postgres.staging:senha@staging-host.supabase.co:5432/postgres
NEXTAUTH_URL = https://dropa-colecion-veis-staging.vercel.app
NEXTAUTH_SECRET = staging-secret-different-from-prod
MERCADO_PAGO_ACCESS_TOKEN = TEST-123456789-sandbox-token
MERCADO_PAGO_PUBLIC_KEY = TEST-pub-key-sandbox
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = TEST-pub-key-sandbox
# ... outras variáveis conforme .env.staging
```

#### **Configurar Deploy Automático:**

1. **Settings > Git**
2. **Production Branch:** `staging`
3. **Deploy Hooks:** Configurar se necessário

### **4.2 - Projeto Produção na Vercel**

#### **Verificar Configurações:**

1. **Acessar:** `dropa-colecion-veis` na Vercel
2. **Settings > Environment Variables**
3. **Confirmar variáveis de produção:**

```
DATABASE_URL = postgresql://postgres.mahzeczsuklpnqstqqug:M%4022te24uss@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
NEXTAUTH_URL = https://dropa-colecion-veis.vercel.app
MERCADO_PAGO_ACCESS_TOKEN = APP_USR-5868743863758866-081912-cc1874933181897891fb3a1705745a0f-353925384
# ... variáveis de produção
```

#### **Configurar Deploy Automático:**

1. **Settings > Git**
2. **Production Branch:** `main`

---

## 📚 PASSO 5: Workflow de Desenvolvimento

### **5.1 - Fluxo de Trabalho Diário**

#### **Para Nova Funcionalidade:**

```bash
# 1. Começar do develop
git checkout develop
git pull origin develop

# 2. Criar feature branch
git checkout -b feature/nova-funcionalidade

# 3. Desenvolver localmente (banco staging)
npm run dev
# Testar com banco dropa-staging

# 4. Commit e push
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade

# 5. Pull Request para staging
# GitHub: feature/nova-funcionalidade → staging

# 6. Testar em staging
# URL: https://dropa-colecion-veis-staging.vercel.app

# 7. Pull Request para produção (após aprovação)
# GitHub: staging → main
```

#### **Para Hotfix:**

```bash
# 1. Começar do main
git checkout main
git pull origin main

# 2. Criar hotfix branch
git checkout -b hotfix/correcao-urgente

# 3. Corrigir problema
# Testar localmente

# 4. Deploy direto para produção
git add .
git commit -m "fix: corrigir problema urgente"
git push origin hotfix/correcao-urgente

# 5. Pull Request para main (revisão rápida)
# 6. Merge para staging também
```

### **5.2 - Comandos Úteis**

```bash
# Verificar ambiente atual
echo $NODE_ENV

# Sincronizar dados prod → staging (periodicamente)
npm run db:sync-staging

# Backup antes de mudanças importantes
npm run backup

# Reset banco de staging (se necessário)
npm run db:reset-staging
```

---

## 📚 PASSO 6: Scripts de Automação

### **6.1 - package.json - Adicionar Scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:staging": "NODE_ENV=staging next dev",
    "build": "next build",
    "start": "next start",
    "db:migrate": "prisma migrate dev",
    "db:migrate:staging": "DATABASE_URL=$STAGING_DATABASE_URL prisma migrate dev",
    "db:sync-staging": "node scripts/sync-prod-to-staging.js",
    "db:reset-staging": "node scripts/reset-staging-db.js",
    "backup": "node scripts/backup.js",
    "backup:production": "node scripts/backup-production.js"
  }
}
```

### **6.2 - Script de Sincronização**

Criar `scripts/sync-prod-to-staging.js`:

```javascript
#!/usr/bin/env node

const { exec } = require('child_process')

console.log('🔄 SINCRONIZANDO PRODUÇÃO → STAGING\n')

const PROD_URL = process.env.DATABASE_URL
const STAGING_URL = process.env.STAGING_DATABASE_URL

if (!PROD_URL || !STAGING_URL) {
  console.error('❌ URLs de banco não configuradas')
  process.exit(1)
}

async function syncDatabases() {
  try {
    console.log('1️⃣ Fazendo backup da produção...')
    
    const backupCommand = `pg_dump "${PROD_URL}" --format=custom --no-owner --no-privileges --file=temp-prod-backup.sql`
    
    exec(backupCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro no backup:', error)
        return
      }
      
      console.log('2️⃣ Restaurando no staging...')
      
      const restoreCommand = `pg_restore --verbose --clean --no-acl --no-owner -d "${STAGING_URL}" temp-prod-backup.sql`
      
      exec(restoreCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Erro na restauração:', error)
          return
        }
        
        console.log('✅ Sincronização concluída!')
        console.log('🧹 Limpando arquivos temporários...')
        
        exec('rm -f temp-prod-backup.sql', () => {
          console.log('🎉 Staging atualizado com dados de produção!')
        })
      })
    })
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
  }
}

syncDatabases()
```

---

## 📚 PASSO 7: Configuração de CI/CD

### **7.1 - GitHub Actions (Opcional)**

Criar `.github/workflows/staging.yml`:

```yaml
name: Deploy Staging

on:
  push:
    branches: [ staging ]
  pull_request:
    branches: [ staging ]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
    
    - name: Build application
      run: npm run build
      env:
        DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        NEXTAUTH_URL: https://dropa-colecion-veis-staging.vercel.app
```

### **7.2 - Configurar Secrets no GitHub**

1. **Ir para:** `Settings > Secrets and variables > Actions`
2. **Adicionar secrets:**
   - `STAGING_DATABASE_URL`
   - `STAGING_NEXTAUTH_SECRET`
   - Outros conforme necessário

---

## 📚 PASSO 8: Monitoramento e Logs

### **8.1 - Dashboard de Ambientes**

Criar `scripts/environment-status.js`:

```javascript
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
console.log('   npm run db:sync-staging  # Sincronizar dados')
console.log('   npm run backup           # Backup local')
console.log('   git checkout staging     # Mudar para staging')
console.log('   git checkout main        # Mudar para produção')
```

---

## 📚 PASSO 9: Checklist de Implementação

### **✅ Tarefas de Configuração**

#### **Supabase:**
- [ ] Verificar banco `dropa-staging` existe
- [ ] Copiar dados de produção para staging
- [ ] Configurar usuários e permissões
- [ ] Testar conexão

#### **GitHub:**
- [ ] Criar branch `staging`
- [ ] Configurar protection rules
- [ ] Configurar secrets para CI/CD
- [ ] Testar workflow

#### **Vercel Staging:**
- [ ] Configurar variáveis de ambiente
- [ ] Conectar branch `staging`
- [ ] Testar deploy automático
- [ ] Verificar funcionamento

#### **Vercel Produção:**
- [ ] Verificar configurações atuais
- [ ] Confirmar branch `main`
- [ ] Validar variáveis de produção
- [ ] Testar deploy

#### **Local:**
- [ ] Criar `.env.local`
- [ ] Configurar banco staging
- [ ] Testar desenvolvimento local
- [ ] Configurar scripts npm

---

## 📚 PASSO 10: Comandos de Execução

### **10.1 - Ordem de Implementação**

```bash
# 1. Configurar variáveis locais
cp .env .env.production.backup
# Editar .env.local com configurações de staging

# 2. Configurar branches
git checkout -b staging
git push -u origin staging

# 3. Testar desenvolvimento local
npm run dev
# Verificar se conecta no banco staging

# 4. Configurar Vercel Staging
# Acessar dashboard e configurar variáveis

# 5. Testar deploy staging
git add .
git commit -m "feat: configurar ambiente staging"
git push origin staging

# 6. Verificar funcionamento
curl https://dropa-colecion-veis-staging.vercel.app/api/health

# 7. Configurar workflow de desenvolvimento
git checkout -b develop
git push -u origin develop
```

### **10.2 - Comandos de Manutenção**

```bash
# Sincronizar dados periodicamente
npm run db:sync-staging

# Verificar status dos ambientes
node scripts/environment-status.js

# Backup antes de mudanças importantes
npm run backup

# Limpar dados de teste no staging
npm run db:reset-staging
```

---

## 📚 RESUMO EXECUTIVO

### **🎯 Benefícios da Separação:**

✅ **Segurança:** Desenvolvimento não afeta produção  
✅ **Testes:** Ambiente seguro para homologação  
✅ **Rollback:** Facilita reversão de mudanças  
✅ **Performance:** Otimização independente  
✅ **Compliance:** Boas práticas de DevOps  

### **🔧 Estrutura Final:**

```
┌─────────────┬──────────────────┬─────────────────┐
│ Ambiente    │ Banco            │ Branch/Deploy   │
├─────────────┼──────────────────┼─────────────────┤
│ Local Dev   │ dropa-staging    │ feature/*       │
│ Staging     │ dropa-staging    │ staging         │
│ Production  │ dropa            │ main            │
└─────────────┴──────────────────┴─────────────────┘
```

### **🚀 Workflow:**

```
feature/nova → staging → main
     ↓           ↓        ↓
  Local Dev → Staging → Production
     ↓           ↓        ↓
 dropa-staging → dropa-staging → dropa
```

---

**🎉 Com essa configuração, você terá um ambiente de desenvolvimento profissional, seguro e escalável!**