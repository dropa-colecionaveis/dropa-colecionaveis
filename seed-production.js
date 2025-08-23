// Simple script to seed production database
const { execSync } = require('child_process');

console.log('🌱 Seeding production database...');

try {
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Run the seed script
  execSync('npx tsx prisma/seed.ts', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  
  console.log('✅ Production database seeded successfully!');
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
  process.exit(1);
}