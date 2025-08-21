# 💾 Sistema de Backup Automático Criptografado

## 📋 Visão Geral

O sistema de backup foi desenvolvido para garantir a segurança e integridade dos dados da plataforma Colecionáveis, implementando as melhores práticas de backup, criptografia e recuperação de dados.

## 🔧 Características Principais

### ✅ **Segurança**
- **Criptografia AES-256**: Todos os backups são criptografados
- **Verificação de Integridade**: Checksums SHA-256 para cada backup
- **Chaves de Criptografia**: Configuráveis via variáveis de ambiente

### ✅ **Automação**
- **Backup Automático**: Scripts prontos para cron jobs
- **Retenção Automática**: Remove backups antigos automaticamente
- **Logs de Auditoria**: Registro completo de todas as operações

### ✅ **Recuperação**
- **Restauração Simples**: Scripts automatizados de restore
- **Validação de Backup**: Verificação de integridade antes da restauração
- **Backup de Segurança**: Cria backup do estado atual antes de restaurar

## 📁 Estrutura de Arquivos

```
scripts/
├── backup.js              # Script principal de backup
├── restore.js             # Script de restauração
└── cron-examples.sh       # Exemplos de configuração cron

backups/                   # Diretório de backups (criado automaticamente)
├── backup-YYYY-MM-DDTHH-mm-ss-sssZ.db.enc    # Arquivo de backup criptografado
├── backup-YYYY-MM-DDTHH-mm-ss-sssZ.checksum  # Checksum para verificação
├── backup-YYYY-MM-DDTHH-mm-ss-sssZ.manifest.json # Metadados do backup
├── backup.log             # Log de operações de backup
└── restore.log           # Log de operações de restauração
```

## ⚙️ Configuração

### **Variáveis de Ambiente**

Crie ou edite seu arquivo `.env` com as seguintes configurações:

```bash
# Configurações de Backup
BACKUP_DIR="./backups"                           # Diretório de destino dos backups
BACKUP_ENCRYPTION_KEY="sua-chave-super-segura"  # Chave de criptografia (OBRIGATÓRIO)
BACKUP_RETENTION_DAYS="30"                      # Dias para manter backups antigos
DATABASE_URL="file:./prisma/dev.db"            # Caminho do banco de dados
```

### **⚠️ Importante - Chave de Criptografia**

```bash
# DESENVOLVIMENTO (exemplo)
BACKUP_ENCRYPTION_KEY="dev-encryption-key-change-in-production"

# PRODUÇÃO (use uma chave forte e única)
BACKUP_ENCRYPTION_KEY="Pr0d-B@ckup-K3y-2024-Str0ng-3ncrypt10n-K3y"
```

> **🔒 CRITICAL**: Mantenha a chave de criptografia segura! Sem ela, os backups não podem ser restaurados.

## 🚀 Como Usar

### **1. Backup Manual**

```bash
# Executar backup imediatamente
node scripts/backup.js

# Exemplo de saída:
🚀 Starting automated backup process...
📅 Timestamp: 2025-08-20T20:30:15.123Z
💾 Database: ./prisma/dev.db
📁 Backup directory: ./backups
🔄 Retention: 30 days
──────────────────────────────────────────────────
🔄 Starting database backup...
📂 Copying database file...
🔐 Generating checksum...
🔒 Encrypting backup...
✅ Backup created successfully: backup-2025-08-20T20-30-15-123Z
📊 Backup size: 2.45 MB
✅ Backup integrity verified successfully
🧹 Cleaning up old backups...
✅ Cleanup completed. Deleted 0 old files.
──────────────────────────────────────────────────
🏁 Backup process finished: SUCCESS
```

### **2. Listar Backups Disponíveis**

```bash
node scripts/restore.js list

# Exemplo de saída:
📋 Available backups:
────────────────────────────────────────────────────────────────────────────────
📦 backup-2025-08-20T20-30-15-123Z.db.enc
   📅 Created: 20/08/2025, 17:30:15
   📊 Size: 2.45 MB
   🔐 Encrypted: Yes
   ✅ Available: Yes

📦 backup-2025-08-20T14-15-30-456Z.db.enc
   📅 Created: 20/08/2025, 11:15:30
   📊 Size: 2.42 MB
   🔐 Encrypted: Yes
   ✅ Available: Yes
```

### **3. Restaurar Backup**

```bash
# Restaurar backup específico
node scripts/restore.js restore backup-2025-08-20T20-30-15-123Z

# Exemplo de saída:
🔄 Restoring backup: backup-2025-08-20T20-30-15-123Z
🔓 Decrypting backup...
✅ Verifying integrity...
💾 Creating database backup before restore...
📂 Current database backed up to: ./prisma/dev.db.backup-1724187615789
📝 Restoring database...
✅ Database restored successfully!
```

### **4. Validar Integridade de Backup**

```bash
# Verificar se um backup está íntegro
node scripts/restore.js validate backup-2025-08-20T20-30-15-123Z

# Exemplo de saída:
🔍 Validating backup: backup-2025-08-20T20-30-15-123Z
✅ Backup validation successful
📊 Backup size: 2.45 MB
```

## ⏰ Backup Automático (Cron Jobs)

### **Configuração de Cron**

```bash
# Editar crontab
crontab -e

# Adicionar uma das linhas abaixo (escolha a frequência desejada):

# Backup diário às 2h da manhã
0 2 * * * cd /caminho/para/seu/projeto && node scripts/backup.js >> /var/log/backup.log 2>&1

# Backup a cada 6 horas
0 */6 * * * cd /caminho/para/seu/projeto && node scripts/backup.js >> /var/log/backup.log 2>&1

# Backup duas vezes por dia (6h e 18h)
0 6,18 * * * cd /caminho/para/seu/projeto && node scripts/backup.js >> /var/log/backup.log 2>&1

# Backup semanal (domingos às 3h) - para teste
0 3 * * 0 cd /caminho/para/seu/projeto && node scripts/backup.js >> /var/log/backup.log 2>&1
```

### **Configuração para Produção**

```bash
# Exemplo de cron job para produção
0 2 * * * cd /opt/colecionaveis && \
  BACKUP_DIR="/var/backups/colecionaveis" \
  BACKUP_ENCRYPTION_KEY="sua-chave-producao" \
  BACKUP_RETENTION_DAYS="30" \
  node scripts/backup.js >> /var/log/colecionaveis-backup.log 2>&1
```

## 📊 Monitoramento e Logs

### **Logs de Backup**

Os logs são salvos em `backups/backup.log` no formato JSON:

```json
{
  "timestamp": "2025-08-20T20:30:15.123Z",
  "type": "BACKUP",
  "success": true,
  "filename": "/path/to/backup-2025-08-20T20-30-15-123Z.db.enc",
  "size": 2569216,
  "checksum": "a1b2c3d4e5f6...",
  "error": null
}
```

### **Logs de Restauração**

Os logs são salvos em `backups/restore.log`:

```json
{
  "timestamp": "2025-08-20T20:35:10.456Z",
  "type": "RESTORE",
  "success": true,
  "backupName": "backup-2025-08-20T20-30-15-123Z",
  "backupTimestamp": "2025-08-20T20:30:15.123Z",
  "restoredSize": 2569216
}
```

### **Monitoramento de Saúde**

```bash
# Verificar se os backups estão funcionando
tail -f /var/log/backup.log

# Verificar último backup
ls -la backups/*.enc | tail -1

# Verificar espaço em disco
df -h /var/backups
```

## 📋 Arquivo Manifest

Cada backup inclui um arquivo `.manifest.json` com metadados:

```json
{
  "timestamp": "2025-08-20T20:30:15.123Z",
  "filename": "backup-2025-08-20T20-30-15-123Z.db.enc",
  "checksum": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "size": 2569216,
  "type": "sqlite",
  "encrypted": true,
  "retentionDays": 30
}
```

## 🔐 Segurança e Melhores Práticas

### **✅ Implementado**

- **Criptografia AES-256**: Proteção contra acesso não autorizado
- **Verificação de Integridade**: Checksums SHA-256 detectam corrupção
- **Backup Incremental**: Remove dados antigos automaticamente
- **Logs Auditáveis**: Rastro completo de todas as operações
- **Backup de Segurança**: Preserva estado atual antes de restaurar

### **🔒 Recomendações de Segurança**

1. **Chave de Criptografia**:
   - Use chaves longas e complexas (mínimo 32 caracteres)
   - Diferentes chaves para desenvolvimento e produção
   - Armazene chaves em local seguro (não no código)

2. **Armazenamento**:
   - Backups locais E remotos (redundância)
   - Armazenamento em local físico diferente
   - Controle de acesso restrito ao diretório de backups

3. **Monitoramento**:
   - Alertas para falhas de backup
   - Verificação periódica de integridade
   - Teste de restauração regularmente

## 🚨 Procedimentos de Emergência

### **Recuperação de Desastre**

1. **Identificar o último backup válido**:
   ```bash
   node scripts/restore.js list
   ```

2. **Validar integridade do backup**:
   ```bash
   node scripts/restore.js validate [backup-name]
   ```

3. **Restaurar banco de dados**:
   ```bash
   node scripts/restore.js restore [backup-name]
   ```

4. **Verificar funcionamento**:
   ```bash
   npm run dev
   # Testar funcionalidades críticas
   ```

### **Backup de Emergência**

```bash
# Backup imediato antes de mudanças críticas
BACKUP_DIR="/tmp/emergency" node scripts/backup.js
```

## 🔧 Troubleshooting

### **Problemas Comuns**

**❌ "Encryption key not found"**
```bash
# Solução: Definir chave de criptografia
export BACKUP_ENCRYPTION_KEY="sua-chave-aqui"
```

**❌ "Database file not found"**
```bash
# Solução: Verificar caminho do banco
ls -la prisma/dev.db
export DATABASE_URL="file:./prisma/dev.db"
```

**❌ "Permission denied"**
```bash
# Solução: Ajustar permissões
chmod +x scripts/backup.js scripts/restore.js
```

**❌ "Backup validation failed"**
```bash
# Possíveis causas:
# 1. Arquivo corrompido
# 2. Chave de criptografia incorreta
# 3. Backup incompleto

# Solução: Usar backup anterior
node scripts/restore.js list
node scripts/restore.js validate [backup-anterior]
```

## 📈 Otimizações Futuras

### **Melhorias Planejadas**

- [ ] **Backup Incremental**: Apenas mudanças desde último backup
- [ ] **Compressão**: Reduzir tamanho dos arquivos
- [ ] **Backup Remoto**: Sincronização com AWS S3/Google Cloud
- [ ] **Interface Web**: Dashboard para gerenciar backups
- [ ] **Notificações**: Alertas por email/Slack
- [ ] **Múltiplos Bancos**: Suporte para backup de múltiplas bases

### **Integração com Cloud**

```bash
# Exemplo futuro - AWS S3
aws s3 sync ./backups s3://colecionaveis-backups/

# Exemplo futuro - Google Cloud
gsutil rsync -r ./backups gs://colecionaveis-backups/
```

## 📞 Suporte

Para problemas com o sistema de backup:

1. **Verifique os logs**: `tail -f backups/backup.log`
2. **Teste manualmente**: `node scripts/backup.js`
3. **Valide backups**: `node scripts/restore.js validate [backup-name]`
4. **Contate o administrador**: admin@colecionaveis.com

---

## ⚡ Comandos Rápidos

```bash
# Backup agora
node scripts/backup.js

# Listar backups
node scripts/restore.js list

# Restaurar último backup
node scripts/restore.js restore $(ls backups/*.manifest.json | sed 's/.*backup-/backup-/' | sed 's/.manifest.json//' | sort | tail -1)

# Verificar espaço
du -sh backups/

# Limpar backups antigos manualmente
find backups/ -name "*.enc" -mtime +30 -delete
```

---

**🎯 Sistema implementado com sucesso! Backup automático, seguro e confiável.**