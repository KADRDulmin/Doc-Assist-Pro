const fs = require('fs');
const path = require('path');
const os = require('os');

// Get local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.keys(interfaces).forEach((ifname) => {
    interfaces[ifname].forEach((iface) => {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });
  
  return addresses;
}

// Get the IP addresses
const ipAddresses = getLocalIpAddresses();
console.log('Available local IP addresses:');
ipAddresses.forEach((ip, i) => console.log(`${i + 1}. ${ip}`));

// Use the first IP address or fallback to localhost
const selectedIp = ipAddresses.length > 0 ? ipAddresses[0] : 'localhost';
console.log(`\nSelected IP: ${selectedIp}`);

// Update app config
const appJsonPath = path.join(__dirname, '..', 'app.json');
let appJson;

try {
  const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
  appJson = JSON.parse(appJsonContent);
  
  // Create or update the extra field
  if (!appJson.expo.extra) {
    appJson.expo.extra = {};
  }
  
  appJson.expo.extra.devServerIp = selectedIp;
  
  // Write back to app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log(`Updated app.json with dev server IP: ${selectedIp}`);
} catch (error) {
  console.error('Error updating app.json:', error.message);
}

// Also update environment variables if .env file exists
const envPath = path.join(__dirname, '..', '.env');
try {
  let envContent = '';
  
  // Try to read existing .env
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (err) {
    // File doesn't exist yet
  }
  
  // Replace or add API_HOST variable
  const apiHostRegex = /API_HOST=.*/;
  const newApiHostLine = `API_HOST=${selectedIp}`;
  
  if (apiHostRegex.test(envContent)) {
    envContent = envContent.replace(apiHostRegex, newApiHostLine);
  } else {
    envContent += `\n${newApiHostLine}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated .env file with API_HOST=${selectedIp}`);
} catch (error) {
  console.error('Error updating .env file:', error.message);
}

console.log('\nYou can now run your Expo app with these settings.');
console.log('If the connection still fails, make sure:');
console.log('1. The backend server is running');
console.log('2. The backend server accepts connections from external IP addresses');
console.log('3. Your device is on the same network as your development machine');
