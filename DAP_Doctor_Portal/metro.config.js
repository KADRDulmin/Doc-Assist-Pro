// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Metro configuration
const defaultConfig = getDefaultConfig(__dirname);

// Add specific extensions for Metro to process
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'mjs',
  'cjs'
];

// Handle Node.js modules
defaultConfig.resolver.extraNodeModules = {
  // Provide empty implementations for Node.js modules
  ...require('node-libs-browser'),
  'crypto': require.resolve('crypto-browserify'),
  'stream': require.resolve('stream-browserify'),
  'path': require.resolve('path-browserify'),
  'fs': require.resolve('./utils/empty.js'),
  'net': require.resolve('./utils/empty.js'),
  'tls': require.resolve('./utils/empty.js'),
  'child_process': require.resolve('./utils/empty.js'),
};

module.exports = defaultConfig;
