#!/bin/bash

# Backup Cron Job Examples
# Add these to your crontab with: crontab -e

# Daily backup at 2 AM
# 0 2 * * * cd /path/to/your/project && node scripts/backup.js >> /var/log/backup.log 2>&1

# Backup every 6 hours
# 0 */6 * * * cd /path/to/your/project && node scripts/backup.js >> /var/log/backup.log 2>&1

# Backup twice daily (6 AM and 6 PM)
# 0 6,18 * * * cd /path/to/your/project && node scripts/backup.js >> /var/log/backup.log 2>&1

# Weekly backup on Sundays at 3 AM (for testing)
# 0 3 * * 0 cd /path/to/your/project && node scripts/backup.js >> /var/log/backup.log 2>&1

# Environment variables for production
export BACKUP_DIR="/var/backups/colecionaveis"
export BACKUP_ENCRYPTION_KEY="your-super-secure-encryption-key-here"
export BACKUP_RETENTION_DAYS="30"
export DATABASE_URL="file:./prisma/prod.db"

# Example production cron job
# 0 2 * * * cd /opt/colecionaveis && BACKUP_DIR="/var/backups/colecionaveis" BACKUP_ENCRYPTION_KEY="prod-key" node scripts/backup.js >> /var/log/colecionaveis-backup.log 2>&1

echo "Backup cron job examples created."
echo "To set up automatic backups:"
echo "1. Copy your preferred cron line"
echo "2. Run 'crontab -e'"
echo "3. Paste the line and save"
echo "4. Make sure to update the paths and encryption key"