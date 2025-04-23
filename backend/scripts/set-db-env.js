/**
 * Generate .env file with database connection settings
 * This helps to set the right connection parameters for local development
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if Docker is running
let isDockerRunning = false;
try {
  execSync('docker ps', { stdio: 'ignore' });
  isDockerRunning = true;
} catch (error) {
  console.log('Docker not detected or not running');
}

// Default database connection settings
const dbSettings = {
  PGHOST: isDockerRunning ? 'localhost' : 'localhost',
  PGPORT: '5432',
  PGUSER: 'postgres',
  PGPASSWORD: 'postgres',
  PGDATABASE: 'doc_assist'
};

// Path to .env file
const envPath = path.join(__dirname, '..', '.env');

// Read existing .env file if it exists
let existingEnv = {};
try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        existingEnv[key.trim()] = value.trim();
      }
    });
  }
} catch (error) {
  console.error('Error reading existing .env file:', error);
}

// Merge existing env with database settings
const newEnv = {
  ...existingEnv,
  ...dbSettings
};

// Generate .env content
const envContent = Object.entries(newEnv)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write .env file
fs.writeFileSync(envPath, envContent);

console.log(`Database connection settings written to ${envPath}`);
console.log('Connection settings:');
Object.entries(dbSettings).forEach(([key, value]) => {
  console.log(`  ${key}=${value}`);
});

console.log('\nTo test database connection run:');
console.log('  npm run setup-db');
