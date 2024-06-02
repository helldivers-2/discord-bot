import {ActivityType, Client} from 'discord.js';
import {logger} from '../../handlers';
import {config} from '../../config';
import {startupFetchMessages} from './message';

const VERSION = config.VERSION;

const onReady = async (client: Client) => {
  if (!client.user) throw Error('Client not initialised');
  const serverCount = (await client.guilds.fetch()).size;

  client.user.setActivity({
    type: ActivityType.Watching,
    name: 'encoded transmissions',
  });
  client.user.setStatus('dnd');

  logger.info(
    `[v${VERSION}] Serving ${serverCount} servers as ${client.user?.tag}`,
    {
      type: 'support-startup',
    }
  );

  await startupFetchMessages(client);
};

export {onReady};
