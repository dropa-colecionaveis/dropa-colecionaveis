#!/bin/bash

# Script para configurar backup automático diário
# Execute: chmod +x scripts/setup-daily-backup.sh && ./scripts/setup-daily-backup.sh

echo "🔧 CONFIGURANDO BACKUP AUTOMÁTICO DIÁRIO"
echo "========================================"
echo ""

# Obter caminho absoluto do projeto
PROJECT_PATH=$(pwd)
echo "📁 Caminho do projeto: $PROJECT_PATH"

# Verificar se o script de backup existe
if [ ! -f "$PROJECT_PATH/scripts/backup.js" ]; then
    echo "❌ Script de backup não encontrado em $PROJECT_PATH/scripts/backup.js"
    exit 1
fi

echo "✅ Script de backup encontrado"

# Criar entrada do cron job
CRON_COMMAND="0 2 * * * cd $PROJECT_PATH && node scripts/backup.js >> $PROJECT_PATH/backups/cron-backup.log 2>&1"

echo ""
echo "🕐 CONFIGURAÇÃO DO CRON JOB:"
echo "   Frequência: Diário às 2h da manhã"
echo "   Comando: $CRON_COMMAND"
echo ""

# Verificar se cron job já existe
if crontab -l 2>/dev/null | grep -q "scripts/backup.js"; then
    echo "⚠️  Cron job de backup já existe!"
    echo ""
    echo "📋 Cron jobs atuais relacionados a backup:"
    crontab -l 2>/dev/null | grep "backup"
    echo ""
    
    read -p "🤔 Deseja substituir a configuração existente? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuração cancelada"
        exit 0
    fi
    
    # Remover cron jobs existentes de backup
    crontab -l 2>/dev/null | grep -v "scripts/backup.js" | crontab -
    echo "🧹 Cron job anterior removido"
fi

# Adicionar novo cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

# Verificar se foi adicionado corretamente
if crontab -l 2>/dev/null | grep -q "scripts/backup.js"; then
    echo "✅ Cron job adicionado com sucesso!"
    echo ""
    echo "📅 CONFIGURAÇÃO APLICADA:"
    echo "   ⏰ Backup diário às 2h da manhã"
    echo "   📂 Backups salvos em: $PROJECT_PATH/backups/"
    echo "   📝 Logs salvos em: $PROJECT_PATH/backups/cron-backup.log"
    echo "   🔄 Retenção: 30 dias (configurável via BACKUP_RETENTION_DAYS)"
    echo ""
    
    echo "🔍 COMO MONITORAR:"
    echo "   Ver logs: tail -f $PROJECT_PATH/backups/cron-backup.log"
    echo "   Listar backups: node scripts/restore.js list"
    echo "   Testar backup: node scripts/backup.js"
    echo ""
    
    echo "🎯 COMANDOS ÚTEIS:"
    echo "   # Ver cron jobs ativos"
    echo "   crontab -l"
    echo ""
    echo "   # Editar cron jobs manualmente"
    echo "   crontab -e"
    echo ""
    echo "   # Remover todos os cron jobs"
    echo "   crontab -r"
    echo ""
    
    echo "✅ BACKUP AUTOMÁTICO CONFIGURADO COM SUCESSO!"
    echo ""
    echo "🎉 Seus dados estarão protegidos automaticamente todos os dias às 2h!"
    
else
    echo "❌ Erro ao configurar cron job"
    echo "🔧 Configure manualmente executando: crontab -e"
    echo "📝 Adicione esta linha:"
    echo "   $CRON_COMMAND"
    exit 1
fi