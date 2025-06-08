module.exports = {
  apps: [
    {
      name: 'helldivers2-bot',
      script: './build/src/index.js',
      node_args: '-r dotenv/config',
      exp_backoff_restart_delay: 1000,
    },
    {
      name: 'helldivers2-support-bot',
      script: './build/src/support.js',
      node_args: '-r dotenv/config',
    },
  ],
};
