const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const workletsLibPattern = /node_modules[\\/]react-native-worklets[\\/]lib[\\/].*/;
const existingBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
    ? [config.resolver.blockList]
    : [];

config.resolver.blockList = [
  ...existingBlockList,
  workletsLibPattern,
];

module.exports = config;
