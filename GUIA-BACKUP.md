# 💾 Guia Completo de Backup - Plataforma Colecionáveis

**Data:** 15/09/2025  
**Status:** Sistema implementado e funcionando ✅  

---

## 🎯 Resposta às Suas Dúvidas

### 1. **Sobre o Reset do Banco de Dados**
Sim, houve um incidente onde dados foram perdidos acidentalmente, mas conseguimos restaurar usando backups existentes. O sistema de backup que você já tem é robusto e funcionou perfeitamente para recuperação.

### 2. **Sobre a Mensagem "BACKUP_DIR not set"**
**SIM**, esta mensagem está relacionada ao sistema de backup. É apenas um aviso que você pode resolver facilmente configurando a variável no arquivo `.env`.

---

## 🔧 Como Resolver a Mensagem de Aviso

### **Solução Rápida:**
Adicione estas linhas no seu arquivo `.env`:

```bash
# Configurações de Backup
BACKUP_DIR="./backups"
BACKUP_ENCRYPTION_KEY="Cole24Backup2025-SuperSegura-ChaveForte-MinimoTrinta2Chars"
BACKUP_RETENTION_DAYS="30"
```

**Depois de adicionar, a mensagem desaparecerá!**

---

## 💾 Como Realizar Backups

### **1. Backup Manual (Imediato)**

```bash
# Comando simples - criar backup agora
node scripts/backup.js
```

**Saída esperada:**
```
🚀 Starting automated backup process...
📅 Timestamp: 2025-09-15T18:30:15.123Z
💾 Database: Supabase PostgreSQL
📁 Backup directory: ./backups
🔄 Retention: 30 days
──────────────────────────────────────────────────
🔄 Starting database backup...
📂 Exporting database...
🔐 Generating checksum...
🔒 Encrypting backup...
✅ Backup created successfully: backup-2025-09-15T18-30-15-123Z
📊 Backup size: 3.2 MB
✅ Backup integrity verified successfully
──────────────────────────────────────────────────
🏁 Backup process finished: SUCCESS
```

### **2. Listar Backups Disponíveis**

```bash
# Ver todos os backups salvos
node scripts/restore.js list
```

**Exemplo de resultado:**
```
📋 Available backups:
────────────────────────────────────────────────────────────────────────────────
📦 backup-2025-09-15T18-30-15-123Z.db.enc
   📅 Created: 15/09/2025, 15:30:15
   📊 Size: 3.2 MB
   🔐 Encrypted: Yes
   ✅ Available: Yes

📦 backup-2025-08-21T16-29-00-728Z.db.enc
   📅 Created: 21/08/2025, 13:29:00
   📊 Size: 2.8 MB
   🔐 Encrypted: Yes
   ✅ Available: Yes
```

### **3. Restaurar um Backup**

```bash
# Restaurar backup específico
node scripts/restore.js restore backup-2025-09-15T18-30-15-123Z

# OU restaurar o backup mais recente automaticamente
node scripts/restore.js restore latest
```

**O sistema fará:**
1. ✅ Criar backup do estado atual (segurança)
2. ✅ Verificar integridade do backup escolhido
3. ✅ Descriptografar o backup
4. ✅ Restaurar os dados
5. ✅ Confirmar que funcionou

---

## ⏰ Backup Automático

### **Configurar Backup Automático (Recomendado)**

**Para backup diário às 2h da manhã:**

1. **Abrir configuração do cron:**
   ```bash
   crontab -e
   ```

2. **Adicionar esta linha:**
   ```bash
   # Backup diário às 2h da manhã
   0 2 * * * cd /mnt/c/Users/mateus.pereira/Desktop/colecionaveis/colecionaveis-platform && node scripts/backup.js >> /var/log/backup.log 2>&1
   ```

**Outras opções de frequência:**
```bash
# Backup a cada 6 horas
0 */6 * * * cd /seu/caminho/projeto && node scripts/backup.js

# Backup duas vezes por dia (6h e 18h)
0 6,18 * * * cd /seu/caminho/projeto && node scripts/backup.js

# Backup semanal (domingos às 3h)
0 3 * * 0 cd /seu/caminho/projeto && node scripts/backup.js
```

---

## 🔐 Segurança dos Backups

### **Características de Segurança:**
- ✅ **Criptografia AES-256**: Backups são criptografados
- ✅ **Verificação de Integridade**: Detecta arquivos corrompidos
- ✅ **Chave Segura**: Necessária para restaurar
- ✅ **Logs Auditáveis**: Registro de todas as operações

### **Chave de Criptografia:**
**IMPORTANTE:** Guarde sua chave de criptografia em local seguro!

```bash
# Exemplo de chave forte (mínimo 32 caracteres)
BACKUP_ENCRYPTION_KEY="Cole24Backup2025-SuperSegura-ChaveForte-MinimoTrinta2Chars"
```

**⚠️ SEM A CHAVE, OS BACKUPS NÃO PODEM SER RESTAURADOS!**

---

## 🚨 Procedimentos de Emergência

### **Recuperação Total do Sistema:**

1. **Listar backups disponíveis:**
   ```bash
   node scripts/restore.js list
   ```

2. **Escolher backup mais recente e validar:**
   ```bash
   node scripts/restore.js validate backup-2025-09-15T18-30-15-123Z
   ```

3. **Restaurar o backup:**
   ```bash
   node scripts/restore.js restore backup-2025-09-15T18-30-15-123Z
   ```

4. **Testar o sistema:**
   ```bash
   npm run dev
   # Verificar se tudo funciona normalmente
   ```

### **Backup de Emergência (antes de mudanças críticas):**
```bash
# Backup imediato antes de alterações importantes
BACKUP_DIR="/tmp/emergency" node scripts/backup.js
```

---

## 📊 Monitoramento dos Backups

### **Verificar Saúde do Sistema:**

```bash
# Ver último backup criado
ls -la backups/*.enc | tail -1

# Verificar logs de backup
tail -f backups/backup.log

# Verificar espaço em disco usado pelos backups
du -sh backups/
```

### **Limpeza Manual (se necessário):**
```bash
# Remover backups com mais de 30 dias
find backups/ -name "*.enc" -mtime +30 -delete
```

---

## ⚙️ Configuração Completa no .env

Adicione estas configurações no seu arquivo `.env`:

```bash
# === CONFIGURAÇÕES DE BACKUP ===
# Diretório onde os backups serão salvos
BACKUP_DIR="./backups"

# Chave para criptografar os backups (IMPORTANTE: guarde em local seguro!)
BACKUP_ENCRYPTION_KEY="Cole24Backup2025-SuperSegura-ChaveForte-MinimoTrinta2Chars"

# Quantos dias manter backups antigos (padrão: 30 dias)
BACKUP_RETENTION_DAYS="30"

# Configuração adicional para logs
LOG_LEVEL="info"
```

---

## 🔍 Localização dos Arquivos

### **Estrutura do Sistema de Backup:**
```
/seu-projeto/
├── scripts/
│   ├── backup.js          # Script principal de backup
│   ├── restore.js         # Script de restauração
│   └── cron-examples.sh   # Exemplos de cron jobs
├── backups/               # Diretório dos backups
│   ├── backup-2025-09-15T18-30-15-123Z.db.enc    # Arquivo criptografado
│   ├── backup-2025-09-15T18-30-15-123Z.checksum  # Verificação integridade
│   ├── backup-2025-09-15T18-30-15-123Z.manifest.json # Metadados
│   ├── backup.log         # Log das operações
│   └── restore.log        # Log das restaurações
└── docs/
    └── BACKUP_SYSTEM.md   # Documentação completa
```

---

## 🎯 Comandos Rápidos (Cola)

```bash
# Fazer backup agora
node scripts/backup.js

# Ver backups disponíveis
node scripts/restore.js list

# Restaurar último backup
node scripts/restore.js restore latest

# Validar integridade de um backup
node scripts/restore.js validate backup-YYYY-MM-DDTHH-mm-ss-sssZ

# Ver espaço usado
du -sh backups/

# Ver logs em tempo real
tail -f backups/backup.log
```

---

## ✅ Checklist de Configuração

- [ ] Adicionar variáveis de backup no `.env`
- [ ] Testar backup manual: `node scripts/backup.js`
- [ ] Configurar backup automático (cron job)
- [ ] Testar restauração: `node scripts/restore.js list`
- [ ] Guardar chave de criptografia em local seguro
- [ ] Documentar procedimento para sua equipe

---

## 🎉 Resumo Final

**Você já tem um sistema de backup completo e seguro!**

✅ **Backups criptografados** com AES-256  
✅ **Verificação de integridade** automática  
✅ **Restauração simples** com 1 comando  
✅ **Backup automático** configurável  
✅ **Logs auditáveis** de todas operações  

**A mensagem "BACKUP_DIR not set" é apenas um aviso - adicione as configurações no `.env` e ela desaparecerá!**

---

**🔗 Para mais detalhes técnicos, consulte: `docs/BACKUP_SYSTEM.md`**