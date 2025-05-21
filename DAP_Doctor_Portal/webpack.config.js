const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const nodeLibs = require('node-libs-browser');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add a rule to include SVG files
  config.module.rules.push({
    test: /\.svg$/,
    use: ['@svgr/webpack', 'url-loader'],
  });

  // Configure aliases for Google Maps
  if (!config.resolve) {
    config.resolve = {};
  }
  
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }
  
  // Set up aliases for Node.js polyfills
  Object.entries(nodeLibs).forEach(([key, value]) => {
    if (value) {
      config.resolve.alias[key] = value;
    } else {
      config.resolve.alias[key] = path.join(__dirname, 'utils/empty.js');
    }
  });
  
  // Make sure to use the polyfilled 'buffer' and 'util' modules
  config.resolve.alias['buffer'] = path.resolve(__dirname, 'node_modules/buffer');
  config.resolve.alias['util'] = path.resolve(__dirname, 'node_modules/util');
  
  // Set up aliases for react-native-maps
  config.resolve.alias['react-native-maps'] = path.resolve(__dirname, 'node_modules/react-native-maps');
  config.resolve.alias['react-native-web-maps'] = '@preflower/react-native-web-maps';

  return config;
};