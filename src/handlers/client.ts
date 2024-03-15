import {Client, GatewayIntentBits} from 'discord.js';

// Init new Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

export {client};
