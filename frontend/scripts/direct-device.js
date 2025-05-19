/**
 * This script provides a direct connection for Android devices
 * without using Docker, which can sometimes introduce networking complexities
 */
const { execSync } = require('child_process');
const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get primary local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const ifaceName in interfaces) {
    const ifaces = interfaces[ifaceName];
    for (const iface of ifaces) {
      // Skip internal and non-IPv4 interfaces
      if (!iface.internal && iface.family === 'IPv4') {
        // WiFi interfaces are usually preferred
        if (ifaceName.toLowerCase().includes('wi') || 
            ifaceName.toLowerCase().includes('wlan') || 
            ifaceName.toLowerCase().includes('wireless')) {
          console.log(`Found WiFi interface: ${ifaceName} with IP: ${iface.address}`);
          return iface.address;
        }
      }
    }
  }
  
  // If no WiFi interface found, try any non-internal IPv4 interface
  for (const ifaceName in interfaces) {
    const ifaces = interfaces[ifaceName];
    for (const iface of ifaces) {
      if (!iface.internal && iface.family === 'IPv4') {
        console.log(`Found non-WiFi interface: ${ifaceName} with IP: ${iface.address}`);
        return iface.address;
      }
    }
  }
  
  return '127.0.0.1'; // Fallback to localhost
}

const localIp = getLocalIpAddress();
console.log(`\n📱 Starting direct device connection with IP: ${localIp}\n`);

// Create a temporary env file with the correct settings
const envContent = `
# Temporary environment file for direct device testing
CI=false
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
REACT_NATIVE_PACKAGER_HOSTNAME=${localIp}
EXPO_PUBLIC_API_URL=http://${localIp}:3000
EXPO_PUBLIC_LOCAL_URL=http://${localIp}:19000
EXPO_NO_DOCTOR=1
EXPO_DEBUG=1
`;

const tempEnvPath = path.join(__dirname, '../.env.device');
fs.writeFileSync(tempEnvPath, envContent);
console.log(`Created temporary environment file at ${tempEnvPath}`);

// Start Expo with direct IP configuration
console.log(`\n📲 Starting Expo with IP: ${localIp}\n`);
console.log(`📝 To connect from your device:`);
console.log(`  1. Make sure your phone is on the same WiFi network as your computer`);
console.log(`  2. Open Expo Go app on your phone`);
console.log(`  3. Scan the QR code or enter: exp://${localIp}:19000\n`);

// Run Expo start with the temporary env file
process.env.DOTENV_CONFIG_PATH = tempEnvPath;
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = localIp;
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.EXPO_PUBLIC_LOCAL_URL = `http://${localIp}:19000`;
process.env.EXPO_PUBLIC_API_URL = `http://${localIp}:3000`;

// Use a more robust approach to start Expo directly with npx
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['expo', 'start', '--clear'];

console.log(`Executing: ${command} ${args.join(' ')}`);

// Start Expo with the enhanced configuration
const expoProcess = spawn(command, args, { 
  stdio: 'inherit',
  env: process.env,
  shell: true
});

// Clean up on exit
expoProcess.on('close', (code) => {
  try {
    fs.unlinkSync(tempEnvPath);
    console.log(`\nCleaned up temporary env file`);
  } catch (err) {
    // Ignore errors on cleanup
  }
  process.exit(code);
});
