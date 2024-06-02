import {config} from './config';
import {
  client,
  onReady,
  messageCreate,
  messageDelete,
  messageUpdate,
} from './support_module';

const {SUPPORT_BOT_TOKEN} = config;

async function main() {
  client.on('ready', async () => onReady(client));

  client.on('messageCreate', async msg => await messageCreate(msg));

  client.on(
    'messageUpdate',
    async (oldMsg, newMsg) => await messageUpdate(oldMsg, newMsg)
  );

  client.on('messageDelete', async msg => await messageDelete(msg));

  await client.login(SUPPORT_BOT_TOKEN);
}

main();
