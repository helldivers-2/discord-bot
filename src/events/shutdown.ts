import {logger, redis} from '../handlers';

const shutdown = async () => {
  logger.info('Received SIGINT, shutting down', {type: 'shutdown'});
  await redis.quit();
  // eslint-disable-next-line no-process-exit
  process.exit(0);
};

export {shutdown};
