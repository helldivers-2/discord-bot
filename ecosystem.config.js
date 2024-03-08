module.exports = {
  apps: [
    {
      name: 'helldivers2-bot',
      script: './build/src/index.js',
      node_args: '-r dotenv/config',
    },
  ],
};
