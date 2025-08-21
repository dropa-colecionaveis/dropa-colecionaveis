#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const crypto = require('crypto')

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups'
const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db'
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'your-backup-encryption-key-here'
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

// Generate timestamp for backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupName = `backup-${timestamp}`

async function createBackup() {
  try {
    console.log('🔄 Starting database backup...')
    
    // Create backup filename
    const backupFile = path.join(BACKUP_DIR, `${backupName}.db`)
    const encryptedFile = path.join(BACKUP_DIR, `${backupName}.db.enc`)
    const checksumFile = path.join(BACKUP_DIR, `${backupName}.checksum`)
    
    // 1. Copy database file
    console.log('📂 Copying database file...')
    fs.copyFileSync(DB_PATH, backupFile)
    
    // 2. Create checksum for integrity verification
    console.log('🔐 Generating checksum...')
    const fileBuffer = fs.readFileSync(backupFile)
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    fs.writeFileSync(checksumFile, checksum)
    
    // 3. Encrypt backup file
    console.log('🔒 Encrypting backup...')
    const cipher = crypto.createCipher('aes256', ENCRYPTION_KEY)
    const input = fs.createReadStream(backupFile)
    const output = fs.createWriteStream(encryptedFile)
    
    await new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output)
      output.on('finish', resolve)
      output.on('error', reject)
    })
    
    // 4. Remove unencrypted backup
    fs.unlinkSync(backupFile)
    
    // 5. Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      filename: `${backupName}.db.enc`,
      checksum: checksum,
      size: fs.statSync(encryptedFile).size,
      type: 'sqlite',
      encrypted: true,
      retentionDays: RETENTION_DAYS
    }
    
    fs.writeFileSync(
      path.join(BACKUP_DIR, `${backupName}.manifest.json`),
      JSON.stringify(manifest, null, 2)
    )
    
    console.log(`✅ Backup created successfully: ${backupName}`)
    console.log(`📊 Backup size: ${(manifest.size / 1024 / 1024).toFixed(2)} MB`)
    
    return {
      success: true,
      filename: encryptedFile,
      checksum: checksum,
      size: manifest.size
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function cleanupOldBackups() {
  try {
    console.log('🧹 Cleaning up old backups...')
    
    const files = fs.readdirSync(BACKUP_DIR)
    const now = Date.now()
    const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000 // Convert days to milliseconds
    
    let deletedCount = 0
    
    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      const age = now - stats.mtime.getTime()
      
      if (age > maxAge && (file.endsWith('.db.enc') || file.endsWith('.manifest.json') || file.endsWith('.checksum'))) {
        fs.unlinkSync(filePath)
        deletedCount++
        console.log(`🗑️ Deleted old backup: ${file}`)
      }
    }
    
    console.log(`✅ Cleanup completed. Deleted ${deletedCount} old files.`)
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

async function verifyBackup(encryptedFile, originalChecksum) {
  try {
    console.log('✅ Verifying backup integrity...')
    
    // Decrypt and verify checksum
    const decipher = crypto.createDecipher('aes256', ENCRYPTION_KEY)
    const encryptedData = fs.readFileSync(encryptedFile)
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()])
    const verifyChecksum = crypto.createHash('sha256').update(decryptedData).digest('hex')
    
    if (verifyChecksum === originalChecksum) {
      console.log('✅ Backup integrity verified successfully')
      return true
    } else {
      console.error('❌ Backup integrity check failed!')
      return false
    }
    
  } catch (error) {
    console.error('❌ Backup verification failed:', error)
    return false
  }
}

async function logBackupEvent(result) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'BACKUP',
      success: result.success,
      filename: result.filename,
      size: result.size,
      checksum: result.checksum,
      error: result.error || null
    }
    
    const logFile = path.join(BACKUP_DIR, 'backup.log')
    const logLine = JSON.stringify(logEntry) + '\n'
    
    fs.appendFileSync(logFile, logLine)
    
  } catch (error) {
    console.error('❌ Failed to log backup event:', error)
  }
}

// Main backup process
async function main() {
  console.log('🚀 Starting automated backup process...')
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  console.log(`💾 Database: ${DB_PATH}`)
  console.log(`📁 Backup directory: ${BACKUP_DIR}`)
  console.log(`🔄 Retention: ${RETENTION_DAYS} days`)
  console.log('─'.repeat(50))
  
  // Create backup
  const result = await createBackup()
  
  if (result.success) {
    // Verify backup
    const verified = await verifyBackup(result.filename, result.checksum)
    
    if (verified) {
      console.log('✅ Backup process completed successfully')
    } else {
      console.error('❌ Backup verification failed')
      result.success = false
      result.error = 'Backup verification failed'
    }
  }
  
  // Log the event
  await logBackupEvent(result)
  
  // Cleanup old backups
  await cleanupOldBackups()
  
  console.log('─'.repeat(50))
  console.log(`🏁 Backup process finished: ${result.success ? 'SUCCESS' : 'FAILED'}`)
  
  // Exit with appropriate code
  process.exit(result.success ? 0 : 1)
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Backup script crashed:', error)
    process.exit(1)
  })
}

module.exports = {
  createBackup,
  cleanupOldBackups,
  verifyBackup
}