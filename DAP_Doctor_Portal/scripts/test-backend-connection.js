#!/usr/bin/env node
/**
 * Network Connectivity Test Script
 * 
 * This script helps diagnose network connectivity issues between your mobile app
 * and your backend server. It determines all available network interfaces and attempts
 * to connect to the backend server to verify which one works.
 */
const { execSync, spawn } = require('child_process');
const os = require('os');
const http = require('http');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Get all available network interfaces
function getAllNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  // Get all IPv4 non-internal addresses
  Object.keys(interfaces).forEach(ifname => {
    interfaces[ifname].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: ifname,
          address: iface.address,
          // Prioritize common network interfaces
          priority: ifname.toLowerCase().match(/wi-?fi|wireless|wlan/i) ? 3 :
                   ifname.toLowerCase().match(/ethernet|lan/i) ? 2 : 1
        });
      }
    });
  });
  
  addresses.sort((a, b) => b.priority - a.priority);
  return addresses;
}

// Test connectivity to a specific IP:port
async function testConnection(ip, port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: ip,
      port: port,
      path: '/api',
      method: 'GET',
      timeout: 2000 // 2 seconds timeout
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Connection timed out'
      });
    });
    
    req.end();
  });
}

// Check open ports on a specific IP
async function checkOpenPorts(ip, ports) {
  const results = {};
  
  for (const port of ports) {
    const result = await testConnection(ip, port);
    results[port] = result;
  }
  
  return results;
}

// Try to get external IP address
async function getPublicIpAddress() {
  try {
    // This uses a public API to get your external IP
    return new Promise((resolve, reject) => {
      const req = http.get('http://api.ipify.org', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data.trim());
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout getting public IP'));
      });
      
      req.setTimeout(3000); // 3 seconds timeout
    });
  } catch (err) {
    console.error('Could not get public IP:', err.message);
    return null;
  }
}

// Get network gateway
function getDefaultGateway() {
  try {
    if (process.platform === 'win32') {
      const output = execSync('ipconfig', { encoding: 'utf-8' });
      const gatewayMatch = output.match(/Default Gateway[.\s]*: ([^\s]+)/);
      return gatewayMatch ? gatewayMatch[1] : null;
    } else {
      // Linux/macOS
      const output = execSync('ip route | grep default', { encoding: 'utf-8' });
      const gatewayMatch = output.match(/default via ([^\s]+)/);
      return gatewayMatch ? gatewayMatch[1] : null;
    }
  } catch (err) {
    console.error('Error getting default gateway:', err.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('\n🔍 Network Connectivity Test for Doc-Assist-Pro');
  console.log('==============================================');
  
  // Get all interfaces
  const interfaces = getAllNetworkInterfaces();
  
  if (interfaces.length === 0) {
    console.error('❌ No network interfaces found. Are you connected to a network?');
    return;
  }
  
  console.log('\n📡 Available network interfaces:');
  interfaces.forEach((iface, i) => {
    console.log(`  ${i + 1}. ${iface.name}: ${iface.address} ${iface.priority === 3 ? '(recommended)' : ''}`);
  });
  
  // Get default gateway
  const gateway = getDefaultGateway();
  if (gateway) {
    console.log(`\n🌐 Default gateway: ${gateway}`);
  }
  
  // Get public IP
  try {
    const publicIp = await getPublicIpAddress();
    if (publicIp) {
      console.log(`\n🌎 Public IP address: ${publicIp}`);
    }
  } catch (err) {
    console.log(`\n⚠️ Couldn't determine public IP: ${err.message}`);
  }
  
  // Test if the backend server is accessible
  console.log('\n🔌 Testing connectivity to backend server (port 3000)...');
  
  // Test localhost first
  console.log('\nTesting localhost:');
  const localhostResult = await testConnection('localhost', 3000);
  console.log(`  localhost:3000 - ${localhostResult.success 
    ? `✅ Connected (status: ${localhostResult.status})` 
    : `❌ Failed (${localhostResult.error})`}`);
  
  // Test each interface
  console.log('\nTesting all interfaces:');
  for (const iface of interfaces) {
    const result = await testConnection(iface.address, 3000);
    console.log(`  ${iface.name} (${iface.address}:3000) - ${result.success 
      ? `✅ Connected (status: ${result.status})` 
      : `❌ Failed (${result.error})`}`);
  }
  
  // Find best working IP
  let workingIp = null;
  for (const iface of interfaces) {
    const result = await testConnection(iface.address, 3000);
    if (result.success) {
      workingIp = iface.address;
      break;
    }
  }
  
  if (workingIp) {
    console.log(`\n✅ Found working connection: ${workingIp}:3000`);
    
    // Create a temporary .env.network file with the working IP
    const envPath = path.join(__dirname, '..', '.env.network');
    const envContent = `
# Network configuration created by test-backend-connection.js
# Created ${new Date().toISOString()}
EXPO_PUBLIC_API_IP=${workingIp}
EXPO_PUBLIC_API_URL=http://${workingIp}:3000
REACT_NATIVE_PACKAGER_HOSTNAME=${workingIp}
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`\n📝 Created environment file at ${envPath}`);
    console.log('\n💡 To use this configuration, run:');
    console.log(`  npx cross-env DOTENV_CONFIG_PATH=${envPath} expo start --clear\n`);
  } else {
    console.log('\n❌ Could not find a working connection to the backend server.');
    console.log('\n🔍 Troubleshooting steps:');
    console.log('  1. Make sure your backend server is running on port 3000');
    console.log('  2. Check if your firewall is blocking connections');
    console.log('  3. Ensure the backend server is bound to 0.0.0.0 instead of localhost');
    console.log('  4. Try running the backend with: node app.js --host 0.0.0.0');
  }
  
  console.log('\n==============================================');
}

// Run the main function
main().catch(err => {
  console.error('\n❌ Error running network test:', err);
});