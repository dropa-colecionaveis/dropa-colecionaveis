#!/usr/bin/env node

const { execSync } = require('child_process');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to database (safer than migrate for new deployments)
    console.log('📤 Pushing schema to database...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();