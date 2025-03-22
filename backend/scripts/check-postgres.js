#!/usr/bin/env node
/**
 * PostgreSQL Connection Checker
 * 
 * This script checks if PostgreSQL is running and available
 * and provides troubleshooting steps if there are issues.
 */

const { Client } = require('pg');
const os = require('os');
const dotenv = require('dotenv');
const { spawn } = require('child_process');

// Load environment variables
dotenv.config();

// Get connection settings from environment
const config = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'postgres', // Connect to default initially
  password: process.env.PGPASSWORD || 'postgres',
  port: parseInt(process.env.PGPORT || '5432', 10),
  connectionTimeoutMillis: 5000, // 5 seconds
};

// Try both IPv4 and IPv6
const hosts = [
  config.host,
  config.host === 'localhost' ? '127.0.0.1' : config.host,
  config.host === 'localhost' ? '::1' : config.host,
];

console.log('🔍 PostgreSQL Connection Checker');
console.log('================================');
console.log(`Checking PostgreSQL connection on ${config.host}:${config.port}`);

// Check if database exists
async function checkDatabaseExists(client, dbName) {
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );
  return result.rows.length > 0;
}

// Get OS-specific PostgreSQL service commands
function getServiceCommands() {
  const platform = os.platform();
  if (platform === 'win32') {
    return {
      check: 'sc query postgresql',
      start: 'sc start postgresql',
      info: 'Check Windows Services for PostgreSQL services'
    };
  } else if (platform === 'darwin') {  // macOS
    return {
      check: 'brew services list | grep postgres',
      start: 'brew services start postgresql',
      info: 'Use Homebrew to manage PostgreSQL'
    };
  } else {  // Linux and others
    return {
      check: 'systemctl status postgresql',
      start: 'sudo systemctl start postgresql',
      info: 'Use systemctl to manage PostgreSQL service'
    };
  }
}

// Run a system command
function runCommand(command) {
  console.log(`\nRunning: ${command}`);
  
  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  
  const process = spawn(cmd, args, { shell: true });
  
  process.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });
  
  process.stderr.on('data', (data) => {
    console.error(`Error: ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    console.log(`Command exited with code ${code}`);
  });
}

// Check service status
async function checkService() {
  const commands = getServiceCommands();
  console.log('\n🔍 Checking PostgreSQL service status...');
  runCommand(commands.check);
  
  console.log('\n📋 Troubleshooting Commands:');
  console.log(`Start service: ${commands.start}`);
  console.log(`Note: ${commands.info}`);
}

// Main function
async function main() {
  let successfulConnection = false;
  let targetHost = '';
  
  // Try different host addresses
  for (const host of hosts) {
    const testConfig = { ...config, host };
    const client = new Client(testConfig);
    
    try {
      console.log(`\nTrying to connect to PostgreSQL at ${host}:${config.port}...`);
      await client.connect();
      
      const result = await client.query('SELECT version()');
      console.log(`✅ Connected successfully to ${host}:${config.port}`);
      console.log(`PostgreSQL version: ${result.rows[0].version}`);
      
      // Check if our database exists
      if (process.env.PGDATABASE && process.env.PGDATABASE !== 'postgres') {
        const dbExists = await checkDatabaseExists(client, process.env.PGDATABASE);
        if (dbExists) {
          console.log(`✅ Database '${process.env.PGDATABASE}' exists`);
        } else {
          console.log(`❌ Database '${process.env.PGDATABASE}' does not exist!`);
          console.log(`You may need to create it with: CREATE DATABASE ${process.env.PGDATABASE};`);
        }
      }
      
      successfulConnection = true;
      targetHost = host;
      await client.end();
      break;
    } catch (err) {
      console.log(`❌ Connection to ${host}:${config.port} failed: ${err.message}`);
      try {
        await client.end();
      } catch (e) {
        // Ignore
      }
    }
  }
  
  if (successfulConnection) {
    console.log('\n✅ PostgreSQL connection successful!');
    if (config.host === 'localhost' && targetHost !== 'localhost') {
      console.log(`\n💡 Tip: Use ${targetHost} instead of localhost in your .env file:`);
      console.log(`PGHOST=${targetHost}`);
    }
  } else {
    console.log('\n❌ All PostgreSQL connection attempts failed!');
    console.log('\n📋 Troubleshooting tips:');
    console.log('1. Check if PostgreSQL is installed and running');
    console.log('2. Verify PostgreSQL is listening on the expected port');
    console.log('3. Check your credentials in the .env file');
    console.log('4. Make sure the database exists');
    
    // Check the service status
    await checkService();
    
    // Docker suggestion
    console.log('\n🐳 Alternatively, use Docker to run PostgreSQL:');
    console.log('docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres');
    console.log('docker exec -it postgres psql -U postgres -c "CREATE DATABASE doc_assist;"');
  }
}

main().catch(err => {
  console.error('Error in checker script:', err);
});
