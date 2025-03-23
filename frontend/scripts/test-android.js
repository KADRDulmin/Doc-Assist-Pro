const { execSync } = require('child_process');
const os = require('os');

// Get IP addresses
const networkInterfaces = os.networkInterfaces();
const ipAddresses = [];

// Find all IPv4 addresses that aren't internal
Object.keys(networkInterfaces).forEach(ifname => {
  networkInterfaces[ifname].forEach(iface => {
    // Skip internal and non-IPv4 interfaces
    if (!iface.internal && iface.family === 'IPv4') {
      ipAddresses.push(iface.address);
    }
  });
});

console.log('Your network IP addresses for Android/iOS access:');
ipAddresses.forEach((ip, index) => {
  console.log(`${index + 1}. ${ip}`);
});

console.log('\nTo connect Android/iOS devices:');
console.log('1. Make sure your device is on the same network as your computer');
console.log('2. Install Expo Go from the app store');
console.log('3. Set EXPO_PUBLIC_LOCAL_URL in .env to one of these addresses');
console.log('4. Run your Expo app with `npm run docker-start-expo`');
console.log('5. Scan the QR code from the console with Expo Go');

// Try to check if adb exists
try {
  const adbVersion = execSync('adb --version').toString();
  console.log('\nADB detected!');
  console.log('For emulator access, you can port forward with:');
  console.log('adb reverse tcp:8081 tcp:8081');
  console.log('adb reverse tcp:19000 tcp:19000');
} catch (e) {
  console.log('\nADB not found. For emulator access, you may need to:');
  console.log('1. Install Android Studio or Android SDK');
  console.log('2. Add platform-tools to your PATH');
}
