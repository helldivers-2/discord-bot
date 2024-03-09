import {config} from './config';
import {onInteraction, onReady} from './events';
import {client, logger} from './handlers';

const {BOT_TOKEN} = config;

async function main() {
  client.on('ready', async () => await onReady(client));

  // log server join
  client.on('guildCreate', async guild => {
    // first check if server is experiencing an outtage
    if (guild.available) {
      // retrieve new server count
      const serverCount = (await client.guilds.fetch()).size;
      logger.info(`Client joined guild #${serverCount}: ${guild.name}`),
        {
          type: 'info',
        };
    }
  });

  // log server kick
  client.on('guildDelete', guild => {
    if (guild.available)
      logger.info(`Client removed from: ${guild.name}`, {
        type: 'info',
      });
  });

  // handle user interactions (eg. commands)
  client.on(
    'interactionCreate',
    async interaction => await onInteraction(interaction)
  );

  await client.login(BOT_TOKEN);
}

main();
