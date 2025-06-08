import {Client, GatewayIntentBits} from 'discord.js';

// Init new Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  shards: 'auto',
});

export {client};
