# 🚀 Guia de Deploy para Produção

Este documento contém todas as instruções necessárias para colocar a plataforma de colecionáveis online em produção.

## 📋 Pré-requisitos

- [ ] Domínio registrado (ex: `meusite.com`)
- [ ] Certificado SSL configurado
- [ ] Servidor/VPS ou conta em plataforma de cloud
- [ ] Banco de dados PostgreSQL em produção
- [ ] Conta no Mercado Pago (credenciais de produção)

## 🎯 Opções de Deploy

### Opção 1: Vercel (Recomendada - Mais Simples)
### Opção 2: DigitalOcean App Platform  
### Opção 3: VPS/Servidor Próprio
### Opção 4: Railway
### Opção 5: Netlify + Supabase

---

## 🌟 OPÇÃO 1: DEPLOY NO VERCEL (RECOMENDADA)

### Passo 1: Preparar o Código

```bash
# 1. Fazer commit de todas as mudanças
git add .
git commit -m "feat: preparar para deploy em produção"

# 2. Fazer push para GitHub (se ainda não estiver)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

### Passo 2: Configurar Banco de Dados (Supabase)

1. **Criar conta no Supabase**: https://supabase.com
2. **Criar novo projeto**:
   - Nome: `colecionaveis-prod`
   - Região: `South America (São Paulo)`
   - Database Password: `senha-super-forte-123456789`

3. **Obter Connection String**:
   - Ir em Settings → Database
   - Copiar a URI (Connection String)
   - Exemplo: `postgresql://postgres:senha@db.projeto.supabase.co:5432/postgres`

### Passo 3: Deploy no Vercel

1. **Ir para**: https://vercel.com
2. **Conectar com GitHub**
3. **Importar repositório** do projeto
4. **Configurar variáveis de ambiente**:

```env
# Ambiente
NODE_ENV=production

# Database
DATABASE_URL=postgresql://postgres:SENHA@db.PROJETO.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:SENHA@db.PROJETO.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=https://seudominio.vercel.app
NEXTAUTH_SECRET=sua-chave-super-secreta-de-32-caracteres-ou-mais

# Mercado Pago (PRODUÇÃO)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-sua-chave-de-producao
MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua-chave-publica-de-producao
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua-chave-publica-de-producao
MERCADO_PAGO_WEBHOOK_SECRET=sua-chave-webhook-secreta

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

# Email (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM=seuemail@gmail.com
```

5. **Fazer deploy**: Clique em "Deploy"

### Passo 4: Configurar Domínio Personalizado (Opcional)

1. No painel da Vercel → Settings → Domains
2. Adicionar seu domínio: `meusite.com`
3. Configurar DNS do seu domínio:
   - Tipo: `CNAME`
   - Nome: `@` ou `www`
   - Valor: `cname.vercel-dns.com`

### Passo 5: Executar Migrações do Banco

```bash
# No terminal local
npx prisma migrate deploy --preview-feature
npx prisma db seed
```

---

## 🏗️ OPÇÃO 2: DIGITALOCEAN APP PLATFORM

### Passo 1: Preparar Banco de Dados

1. **Criar Managed Database**:
   - PostgreSQL 14
   - Plano: Basic ($15/mês)
   - Região: NYC3 ou próxima

2. **Obter connection string** do painel

### Passo 2: Criar App

1. **Ir para**: https://cloud.digitalocean.com/apps
2. **Criar App** → Conectar GitHub
3. **Configurar build**:
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Environment: Node.js

4. **Configurar variáveis** (mesmas da Vercel)

### Passo 3: Deploy

- DigitalOcean fará deploy automaticamente
- Configure domínio personalizado se necessário

---

## 🖥️ OPÇÃO 3: VPS/SERVIDOR PRÓPRIO

### Passo 1: Preparar Servidor (Ubuntu 20.04+)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gerenciar processo
sudo npm install -g pm2

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Passo 2: Configurar Banco de Dados

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE colecionaveis_prod;
CREATE USER app_user WITH PASSWORD 'senha-super-forte';
GRANT ALL PRIVILEGES ON DATABASE colecionaveis_prod TO app_user;
\q
```

### Passo 3: Deploy da Aplicação

```bash
# Clonar repositório
git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO

# Instalar dependências
npm install

# Criar arquivo de ambiente
nano .env.production

# (Adicionar todas as variáveis de ambiente)

# Executar migrações
npx prisma migrate deploy
npx prisma db seed

# Build da aplicação
npm run build

# Configurar PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Passo 4: Configurar Nginx (Proxy Reverso)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração
sudo nano /etc/nginx/sites-available/colecionaveis
```

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/colecionaveis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Passo 5: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install snapd -y
sudo snap install --classic certbot

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

---

## 🚂 OPÇÃO 4: RAILWAY

### Passo 1: Preparar Deploy

1. **Ir para**: https://railway.app
2. **Conectar GitHub**
3. **Deploy from GitHub repo**

### Passo 2: Configurar Banco

1. **Adicionar PostgreSQL** plugin
2. **Copiar DATABASE_URL** das variáveis do banco

### Passo 3: Configurar Variáveis

- Adicionar todas as variáveis de ambiente no painel
- Railway detecta Next.js automaticamente

---

## ⚙️ CONFIGURAÇÕES OBRIGATÓRIAS PARA PRODUÇÃO

### 1. Variáveis de Ambiente Críticas

```bash
# Gerar chaves seguras
openssl rand -hex 32  # Para NEXTAUTH_SECRET
openssl rand -hex 24  # Para MERCADO_PAGO_WEBHOOK_SECRET
```

### 2. Mercado Pago - Credenciais de Produção

1. **Acessar**: https://www.mercadopago.com.br/developers
2. **Ir em**: Suas integrações → Sua aplicação
3. **Credenciais de produção**:
   - Access Token: `APP_USR-xxx`
   - Public Key: `APP_USR-xxx`

### 3. Configurar Webhooks

1. **No painel do Mercado Pago**:
   - URL: `https://seudominio.com/api/webhooks/mercadopago`
   - Eventos: `payment`, `merchant_order`

### 4. Google OAuth (Se usando)

1. **Console Google**: https://console.cloud.google.com
2. **Credenciais** → OAuth 2.0
3. **URIs de redirecionamento**:
   - `https://seudominio.com/api/auth/callback/google`

---

## 🔒 CHECKLIST DE SEGURANÇA

### Antes do Deploy:

- [ ] `NODE_ENV=production`
- [ ] HTTPS configurado (SSL)
- [ ] Firewall configurado
- [ ] Credenciais de produção do Mercado Pago
- [ ] Senhas fortes (32+ caracteres)
- [ ] Backup do banco configurado
- [ ] Monitoramento configurado

### Após o Deploy:

- [ ] Testar compra com cartão real
- [ ] Testar todos os fluxos principais
- [ ] Verificar logs por erros
- [ ] Configurar alertas de erro
- [ ] Documentar URLs e credenciais

---

## 🛠️ SCRIPTS ÚTEIS

### Script de Deploy Automatizado

```bash
#!/bin/bash
# scripts/deploy-prod.sh

echo "🚀 Iniciando deploy para produção..."

# Validar ambiente
npm run validate-env

# Build
npm run build

# Migrações
npx prisma migrate deploy

# Restart PM2 (se usando VPS)
pm2 restart ecosystem.config.js --env production

echo "✅ Deploy concluído!"
```

### Script de Backup

```bash
#!/bin/bash
# scripts/backup-prod.sh

DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
echo "Backup criado: backup_$DATE.sql"
```

---

## 📞 SUPORTE E TROUBLESHOOTING

### Problemas Comuns:

1. **Erro de HTTPS**: Verificar SSL/certificado
2. **Erro de banco**: Verificar connection string
3. **Erro 500**: Verificar logs da aplicação
4. **Pagamentos não funcionam**: Verificar credenciais MP

### Logs Importantes:

```bash
# Vercel
vercel logs

# DigitalOcean
doctl apps logs SEU_APP_ID

# VPS
pm2 logs
tail -f /var/log/nginx/error.log
```

### Contatos de Emergência:

- **Vercel Support**: https://vercel.com/support
- **Mercado Pago**: https://www.mercadopago.com.br/developers/pt/support
- **Supabase**: https://supabase.com/support

---

## 🎉 PÓS-DEPLOY

### 1. Testes Finais

- [ ] Cadastro de usuário
- [ ] Login/logout
- [ ] Compra de créditos
- [ ] Abertura de pacotes
- [ ] Marketplace
- [ ] Admin panel

### 2. Configurar Monitoramento

```bash
# Instalar Sentry (opcional)
npm install @sentry/nextjs
```

### 3. SEO e Analytics

- [ ] Google Analytics
- [ ] Google Search Console
- [ ] Meta tags configuradas

---

**🎯 RECOMENDAÇÃO**: Use a **Opção 1 (Vercel)** para começar. É mais simples, tem SSL automático e escala automaticamente.

**💰 Custos estimados**:
- Vercel: Gratuito até 100GB/mês
- Supabase: Gratuito até 500MB
- Domínio: ~R$ 40/ano

**🚀 Tempo estimado**: 2-4 horas para deploy completo.

---

*Última atualização: Agosto 2025*