module.exports = {
  apps: [
    {
      name: 'helldivers2-bot',
      script: './build/src/index.js',
      node_args: '-r dotenv/config',
    },
    {
      name: 'helldivers2-support-bot',
      script: './build/src/support.js',
      node_args: '-r dotenv/config',
    },
  ],
};
