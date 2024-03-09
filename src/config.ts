import 'dotenv/config';
require('newrelic');
import {version} from '../package.json';
const isProd = process.env.NODE_ENV === 'production';

const configObj: Record<string, string | number | undefined> = {
  // Bot config
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_OWNER: process.env.BOT_OWNER || '319226464786710539',

  // Database config
  DATABASE_URL: process.env.DATABASE_URL,

  // Bot Commands
  EMBED_COLOUR: process.env.EMBED_COLOUR || 'DarkPurple',
  FOOTER_MESSAGE:
    'Bug reports and suggestions welcome in Discord!\n' +
    `/discord | v${version} | made by Major`,
  DISCORD_INVITE: 'https://discord.gg/levialliance',

  // Project info
  VERSION: version,
};

const config: Record<string, string> = {};
// assert all env vars as non-null and populate config with only strings
Object.keys(configObj).forEach(key => {
  const value = configObj[key];
  if (value === undefined)
    throw new Error(`${key} environment variable required!`);

  config[key] = value as string;
});

export {config, isProd};
