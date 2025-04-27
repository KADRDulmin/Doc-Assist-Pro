#!/usr/bin/env node
/**
 * This script provides a direct connection for mobile devices to the backend server
 * Optimized to find the correct network IP address that your device can connect to
 */
const { execSync } = require('child_process');
const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Get primary local IP address with smarter network interface detection
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  // First, filter out virtual interfaces and docker/container IPs
  for (const ifaceName in interfaces) {
    const ifaces = interfaces[ifaceName];
    for (const iface of ifaces) {
      // Skip internal, non-IPv4, and virtual interfaces
      if (!iface.internal && iface.family === 'IPv4') {
        // Skip common virtual interfaces (like Docker, WSL, VirtualBox, etc.)
        const isVirtual = /docker|veth|vmnet|vbox|wsl|vEthernet/.test(ifaceName.toLowerCase());
        // Skip private network ranges that are typically used for containers/VMs
        const isContainerIP = /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(iface.address) || 
                             /^10\.(?!0\.0\.)/.test(iface.address);
        
        if (!isVirtual && !isContainerIP) {
          let priority = 0;
          const name = ifaceName.toLowerCase();
          
          // WiFi interfaces typically have higher priority for mobile app dev
          if (name.includes('wi-fi') || name.includes('wireless') || 
              name.includes('wlan') || name.includes('wifi')) {
            priority = 3;
          }
          // Ethernet is next best option
          else if (name.includes('ethernet') || name.includes('lan')) {
            priority = 2;
          }
          // Other network interfaces are lowest priority
          else {
            priority = 1;
          }
          
          addresses.push({
            name: ifaceName,
            address: iface.address,
            priority: priority
          });
        }
      }
    }
  }
  
  // Sort by priority (highest first)
  addresses.sort((a, b) => b.priority - a.priority);
  
  if (addresses.length > 0) {
    return addresses[0].address;
  }
  
  // Fallback to classic approach if no suitable interface found
  for (const ifaceName in interfaces) {
    const ifaces = interfaces[ifaceName];
    for (const iface of ifaces) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  
  return '127.0.0.1'; // Last resort fallback
}

// Test if the backend is reachable on a specific IP
async function testBackendConnection(ip, port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: ip,
      port: port,
      path: '/api',
      method: 'GET',
      timeout: 2000 // 2 seconds timeout
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Get IP using ipconfig/ifconfig command as fallback
function getIpFromCommand() {
  try {
    let command;
    let pattern;
    
    if (process.platform === 'win32') {
      command = 'ipconfig';
      pattern = /IPv4 Address[.\s]*: ([^\s]+)/;
    } else {
      command = 'ifconfig || ip addr';
      pattern = /inet (?:addr:)?([\d.]+)/;
    }
    
    const output = execSync(command, { encoding: 'utf-8' });
    const matches = output.match(pattern);
    
    if (matches && matches[1] && !matches[1].startsWith('127.')) {
      return matches[1];
    }
  } catch (err) {
    console.error('Failed to get IP via system command:', err.message);
  }
  
  return null;
}

// Main function
async function main() {
  console.log('\n🚀 Doc-Assist-Pro Device Connection Setup');
  console.log('========================================');
  
  // Get IP addresses through different methods
  const primaryIp = getLocalIpAddress();
  const commandIp = getIpFromCommand();
  
  console.log('\n🔍 Detected network interfaces:');
  
  // Show all available interfaces for debugging
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach(ifaceName => {
    interfaces[ifaceName].forEach(iface => {
      if (iface.family === 'IPv4') {
        console.log(`  - ${ifaceName}: ${iface.address} ${iface.internal ? '(internal)' : ''}`);
      }
    });
  });
  
  // Choose the best IP to use
  let localIp = primaryIp;
  
  // If primary detection gave a likely virtual/container IP, try command output
  if (localIp.startsWith('172.1') || localIp.startsWith('172.2') || localIp.startsWith('172.3')) {
    if (commandIp && !commandIp.startsWith('172.1') && !commandIp.startsWith('172.2') && !commandIp.startsWith('172.3')) {
      console.log(`\n⚠️ Primary IP (${localIp}) appears to be a virtual interface`);
      console.log(`✅ Using alternative IP from system: ${commandIp}`);
      localIp = commandIp;
    }
  }
  
  // Test if backend is reachable with selected IP
  const backendWorking = await testBackendConnection(localIp, 3000);
  if (!backendWorking) {
    console.log(`\n⚠️ Warning: Could not connect to backend at ${localIp}:3000`);
    console.log('   Make sure your backend server is running and accessible.');
    console.log('   You may need to check firewall settings or run the backend with:');
    console.log('   node app.js --host 0.0.0.0');
  } else {
    console.log(`\n✅ Backend server is reachable at ${localIp}:3000`);
  }
  
  console.log(`\n📱 Using network IP: ${localIp}`);
  console.log(`🌐 Backend URL: http://${localIp}:3000/api`);
  console.log(`📡 Expo URL: exp://${localIp}:19000`);
  
  // Create a temporary env file with the correct settings
  const envContent = `
# Temporary environment file for device testing - created ${new Date().toISOString()}
CI=false
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
REACT_NATIVE_PACKAGER_HOSTNAME=${localIp}
EXPO_PUBLIC_API_IP=${localIp}
EXPO_PUBLIC_API_URL=http://${localIp}:3000
EXPO_PUBLIC_LOCAL_URL=http://${localIp}:19000
EXPO_NO_DOCTOR=1
`;

  const tempEnvPath = path.join(__dirname, '..', '.env.device');
  fs.writeFileSync(tempEnvPath, envContent);
  console.log(`\n📝 Created environment file at ${tempEnvPath}`);
  
  // Set environment variables for the current process
  process.env.DOTENV_CONFIG_PATH = tempEnvPath;
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = localIp;
  process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
  process.env.EXPO_PUBLIC_API_IP = localIp;
  process.env.EXPO_PUBLIC_API_URL = `http://${localIp}:3000`;
  process.env.EXPO_PUBLIC_LOCAL_URL = `http://${localIp}:19000`;
  
  // Get platform flags from command-line arguments
  const platformArg = process.argv.includes('--android') 
    ? '--android' 
    : process.argv.includes('--ios') 
      ? '--ios'
      : '';
  
  console.log('\n📱 Device Connection Instructions:');
  console.log('  1. Make sure your phone is on the same WiFi network as your computer');
  console.log('  2. Make sure your backend server is running on port 3000');
  console.log('  3. Open Expo Go app on your phone');
  console.log('  4. Scan the QR code or enter manually: exp://' + localIp + ':19000');
  
  // Use the appropriate command based on platform
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['expo', 'start', '--clear'];
  
  if (platformArg) {
    args.push(platformArg);
  }
  
  console.log(`\n🚀 Launching Expo with: ${command} ${args.join(' ')}`);
  console.log('========================================\n');
  
  // Start Expo with the enhanced configuration
  const expoProcess = spawn(command, args, { 
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
  
  // Handle cleanup on process termination
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping Expo server...');
    expoProcess.kill('SIGINT');
    
    try {
      console.log('🧹 Cleaning up temporary environment file');
      fs.unlinkSync(tempEnvPath);
    } catch (err) {
      // Ignore errors during cleanup
    }
    
    console.log('👋 Goodbye!');
    process.exit(0);
  });
  
  // Handle non-SIGINT process termination
  expoProcess.on('close', (code) => {
    try {
      console.log('\n🧹 Cleaning up temporary environment file');
      fs.unlinkSync(tempEnvPath);
    } catch (err) {
      // Ignore errors during cleanup
    }
    
    process.exit(code || 0);
  });
}

// Run the main function
try {
  main();
} catch (error) {
  console.error('\n❌ Error starting with device IP:');
  console.error(error);
  process.exit(1);
}