#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups'
const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db'
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'your-backup-encryption-key-here'

async function listBackups() {
  try {
    console.log('📋 Available backups:')
    console.log('─'.repeat(80))
    
    const files = fs.readdirSync(BACKUP_DIR)
    const manifests = files.filter(f => f.endsWith('.manifest.json'))
    
    if (manifests.length === 0) {
      console.log('No backups found.')
      return []
    }
    
    const backups = []
    
    for (const manifestFile of manifests) {
      try {
        const manifestPath = path.join(BACKUP_DIR, manifestFile)
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        
        const backupFile = path.join(BACKUP_DIR, manifest.filename)
        const exists = fs.existsSync(backupFile)
        
        backups.push({
          name: manifestFile.replace('.manifest.json', ''),
          manifest: manifest,
          exists: exists
        })
        
        console.log(`📦 ${manifest.filename}`)
        console.log(`   📅 Created: ${new Date(manifest.timestamp).toLocaleString()}`)
        console.log(`   📊 Size: ${(manifest.size / 1024 / 1024).toFixed(2)} MB`)
        console.log(`   🔐 Encrypted: ${manifest.encrypted ? 'Yes' : 'No'}`)
        console.log(`   ✅ Available: ${exists ? 'Yes' : 'No'}`)
        console.log('')
        
      } catch (error) {
        console.error(`❌ Error reading manifest ${manifestFile}:`, error.message)
      }
    }
    
    return backups.filter(b => b.exists)
    
  } catch (error) {
    console.error('❌ Error listing backups:', error)
    return []
  }
}

async function restoreBackup(backupName) {
  try {
    console.log(`🔄 Restoring backup: ${backupName}`)
    
    // Read manifest
    const manifestPath = path.join(BACKUP_DIR, `${backupName}.manifest.json`)
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest file not found: ${manifestPath}`)
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const backupFile = path.join(BACKUP_DIR, manifest.filename)
    const checksumFile = path.join(BACKUP_DIR, `${backupName}.checksum`)
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`)
    }
    
    if (!fs.existsSync(checksumFile)) {
      throw new Error(`Checksum file not found: ${checksumFile}`)
    }
    
    // Read original checksum
    const originalChecksum = fs.readFileSync(checksumFile, 'utf8').trim()
    
    console.log('🔓 Decrypting backup...')
    
    // Decrypt backup
    const decipher = crypto.createDecipher('aes256', ENCRYPTION_KEY)
    const encryptedData = fs.readFileSync(backupFile)
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()])
    
    console.log('✅ Verifying integrity...')
    
    // Verify checksum
    const currentChecksum = crypto.createHash('sha256').update(decryptedData).digest('hex')
    if (currentChecksum !== originalChecksum) {
      throw new Error('Backup integrity check failed! Checksums do not match.')
    }
    
    console.log('💾 Creating database backup before restore...')
    
    // Backup current database
    if (fs.existsSync(DB_PATH)) {
      const currentBackupPath = `${DB_PATH}.backup-${Date.now()}`
      fs.copyFileSync(DB_PATH, currentBackupPath)
      console.log(`📂 Current database backed up to: ${currentBackupPath}`)
    }
    
    console.log('📝 Restoring database...')
    
    // Write restored database
    fs.writeFileSync(DB_PATH, decryptedData)
    
    console.log('✅ Database restored successfully!')
    
    // Log restore event
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'RESTORE',
      success: true,
      backupName: backupName,
      backupTimestamp: manifest.timestamp,
      restoredSize: decryptedData.length
    }
    
    const logFile = path.join(BACKUP_DIR, 'restore.log')
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
    
    return {
      success: true,
      backupName: backupName,
      restoredSize: decryptedData.length
    }
    
  } catch (error) {
    console.error('❌ Restore failed:', error)
    
    // Log restore failure
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'RESTORE',
      success: false,
      backupName: backupName,
      error: error.message
    }
    
    const logFile = path.join(BACKUP_DIR, 'restore.log')
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
    
    return {
      success: false,
      error: error.message
    }
  }
}

async function validateBackup(backupName) {
  try {
    console.log(`🔍 Validating backup: ${backupName}`)
    
    const manifestPath = path.join(BACKUP_DIR, `${backupName}.manifest.json`)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const backupFile = path.join(BACKUP_DIR, manifest.filename)
    const checksumFile = path.join(BACKUP_DIR, `${backupName}.checksum`)
    
    // Check if all files exist
    const files = [manifestPath, backupFile, checksumFile]
    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(`❌ Missing file: ${file}`)
        return false
      }
    }
    
    // Decrypt and verify checksum
    const originalChecksum = fs.readFileSync(checksumFile, 'utf8').trim()
    const decipher = crypto.createDecipher('aes256', ENCRYPTION_KEY)
    const encryptedData = fs.readFileSync(backupFile)
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()])
    const currentChecksum = crypto.createHash('sha256').update(decryptedData).digest('hex')
    
    if (currentChecksum === originalChecksum) {
      console.log('✅ Backup validation successful')
      console.log(`📊 Backup size: ${(decryptedData.length / 1024 / 1024).toFixed(2)} MB`)
      return true
    } else {
      console.error('❌ Backup validation failed: Checksum mismatch')
      return false
    }
    
  } catch (error) {
    console.error('❌ Backup validation failed:', error)
    return false
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  console.log('🔄 Database Restore Tool')
  console.log('─'.repeat(50))
  
  if (!command) {
    console.log('Usage:')
    console.log('  node restore.js list                    # List available backups')
    console.log('  node restore.js restore <backup-name>   # Restore specific backup')
    console.log('  node restore.js validate <backup-name>  # Validate backup integrity')
    console.log('')
    process.exit(1)
  }
  
  switch (command) {
    case 'list':
      await listBackups()
      break
      
    case 'restore':
      const backupName = args[1]
      if (!backupName) {
        console.error('❌ Please specify backup name')
        process.exit(1)
      }
      
      const result = await restoreBackup(backupName)
      process.exit(result.success ? 0 : 1)
      break
      
    case 'validate':
      const validateName = args[1]
      if (!validateName) {
        console.error('❌ Please specify backup name')
        process.exit(1)
      }
      
      const valid = await validateBackup(validateName)
      process.exit(valid ? 0 : 1)
      break
      
    default:
      console.error(`❌ Unknown command: ${command}`)
      process.exit(1)
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Restore script crashed:', error)
    process.exit(1)
  })
}

module.exports = {
  listBackups,
  restoreBackup,
  validateBackup
}