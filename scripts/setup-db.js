#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧠 Brain Dump Database Setup');
console.log('============================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create a .env.local file with the following variables:');
  console.log('DATABASE_URL=your_postgresql_connection_string');
  console.log('JWT_SECRET=your_jwt_secret_key');
  process.exit(1);
}

try {
  console.log('📦 Generating database schema...');
  execSync('bun run db:generate', { stdio: 'inherit' });
  
  console.log('\n🚀 Pushing schema to database...');
  execSync('bun run db:push', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup complete!');
  console.log('\nYou can now run:');
  console.log('  bun run dev     - Start the development server');
  console.log('  bun run db:studio - Open Drizzle Studio to view your database');
  
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.log('\nPlease check your DATABASE_URL and try again.');
  process.exit(1);
}
