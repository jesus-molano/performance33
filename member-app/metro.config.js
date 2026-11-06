// Metro also watches the code shared with the coaches' web: ../shared (booking rules, routine format) and the pure
// account rules of the edge functions. Neither has dependencies, so nothing else needs resolving from outside.
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
const repoRoot = path.resolve(__dirname, '..')

config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.join(repoRoot, 'shared'),
  path.join(repoRoot, 'supabase', 'functions', '_shared'),
]

module.exports = config
