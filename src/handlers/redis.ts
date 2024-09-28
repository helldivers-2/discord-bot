import {createClient} from 'redis';
import {config} from '../config';
import {logger} from './logging';

export const redis = createClient({
  url: config.REDIS_URL,
});

redis.on('ready', () => {
  logger.info('Redis client initialised!', {
    type: 'startup',
  });
});

redis.on('end', () => {
  logger.info('Redis client disconnected', {
    type: 'shutdown',
  });
});
