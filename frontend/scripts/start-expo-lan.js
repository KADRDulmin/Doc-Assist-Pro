/**
 * This script starts Expo with proper LAN connectivity settings
 */
const { execSync } = require('child_process');
const os = require('os');
const { spawn } = require('child_process');

// Get primary local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const ifaceName in interfaces) {
    const ifaces = interfaces[ifaceName];
    for (const iface of ifaces) {
      // Skip internal and non-IPv4 interfaces
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}

const localIp = getLocalIpAddress();
console.log(`\n📱 Starting Expo on LAN with IP: ${localIp}\n`);

// Set environment variables for Expo
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = localIp;
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.EXPO_PUBLIC_LOCAL_URL = `http://${localIp}:19000`;
process.env.CI = 'false';
process.env.EXPO_NO_DOCTOR = '1';

// Start Expo with arguments passed to this script
const args = ['expo', 'start', ...process.argv.slice(2)];
console.log(`Running: ${args.join(' ')}\n`);

// Spawn the expo process
const expoProcess = spawn('npx', args, { 
  stdio: 'inherit',
  env: process.env
});

// Handle process events
expoProcess.on('close', (code) => {
  process.exit(code);
});
