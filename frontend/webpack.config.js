const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add a rule to include SVG files
  config.module.rules.push({
    test: /\.svg$/,
    use: ['@svgr/webpack', 'url-loader'],
  });

  // Configure aliases for Google Maps and other modules
  if (!config.resolve) {
    config.resolve = {};
  }
  
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  // Fix Platform module resolution
  config.resolve.alias['../Utilities/Platform'] = path.resolve(__dirname, 'node_modules/react-native/Libraries/Utilities/Platform');
  
  // Set up aliases for react-native-maps
  config.resolve.alias['react-native-maps'] = path.resolve(__dirname, 'node_modules/react-native-maps');
  config.resolve.alias['react-native-web-maps'] = '@preflower/react-native-web-maps';

  return config;
};