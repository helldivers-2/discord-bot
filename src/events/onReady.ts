import {ActivityType, Client, REST, Routes} from 'discord.js';
import {schedule} from 'node-cron';
import {commandHash, commandList, presenceCmds} from '../commands';
import {config, isProd} from '../config';
import {getData, mappedNames} from '../api-wrapper';
import {compareData, dbData, logger, updateMessages} from '../handlers';

// bot client token, for use with discord API
const BOT_TOKEN = config.BOT_TOKEN;
const PERSISTENT_MESSAGE_INTERVAL = config.PERSISTENT_MESSAGE_INTERVAL;
const API_UPDATE_INTERVAL = config.API_UPDATE_INTERVAL;
const STATUS_UPDATE_INTERVAL = config.STATUS_UPDATE_INTERVAL;
const DB_DATA_INTERVAL = config.DB_DATA_INTERVAL;
const COMPARE_INTERVAL = config.COMPARE_INTERVAL;
const VERSION = config.VERSION;

const onReady = async (client: Client) => {
  if (!client.user) throw Error('Client not initialised');
  const clientId = client.user.id;
  const serverCount = (await client.guilds.fetch()).size;

  const rest = new REST().setToken(BOT_TOKEN);

  logger.info(
    `[v${VERSION}] Serving ${serverCount} servers as ${client.user?.tag}`,
    {
      type: 'startup',
    }
  );

  // register commands as global discord slash commands
  const commandData = commandList.map(command => command.data.toJSON());
  logger.info(`Commands loaded: ${Object.keys(commandHash).join(', ')}`, {
    type: 'startup',
  });

  const commandStart = Date.now();
  rest
    .put(Routes.applicationCommands(clientId), {
      body: commandData,
    })
    .then(() => {
      const time = `${Date.now() - commandStart}ms`;
      logger.info(`Loaded ${commandData.length} commands in ${time}`, {
        type: 'startup',
      });
    });

  // start = Date.now();
  // // get api data on startup
  // await getData().then(data => {
  //   mappedNames.planets = data.Planets.map(x => x.name);
  //   mappedNames.campaignPlanets = data.Campaigns.map(x => x.planetName);
  // });
  //
  // // retrieve encounters and load them as autocomplete suggestions
  // time = `${Date.now() - start}ms`;
  // logger.info(`Loaded ${mappedNames.planets.length} planets in ${time}`, {
  //   type: 'startup',
  // });

  // load wiki pages
  // const wiki = loadWikiFiles('./wiki');
  // wikiCmd.buttons = wiki.categories.map(c => {
  //   const {directory, display_name, content, emoji, thumbnail, image} = c;
  //
  //   const button = new ButtonBuilder()
  //     .setCustomId(directory)
  //     .setLabel(display_name)
  //     .setStyle(ButtonStyle.Secondary);
  //
  //   if (emoji) button.setEmoji(emoji);
  //   return button;
  // });
  // wikiCmd.dirSelect = wiki.categories.reduce(
  //   (acc, c) => {
  //     acc[c.directory] = new StringSelectMenuBuilder()
  //       .setCustomId(c.directory)
  //       .setPlaceholder('Select a page from this category...')
  //       .addOptions(
  //         wiki.pages
  //           .filter(page => page.page.startsWith(c.directory))
  //           .map(page => {
  //             const option = new StringSelectMenuOptionBuilder()
  //               .setLabel(page.title)
  //               .setValue(page.page);
  //
  //             if (page.description) option.setDescription(page.description);
  //             if (page.emoji) option.setEmoji(page.emoji);
  //             return option;
  //           })
  //       );
  //     return acc;
  //   },
  //   {} as Record<string, StringSelectMenuBuilder>
  // );
  // wikiCmd.pages = wiki.pages;
  // wikiCmd.categories = wiki.categories;
  //
  // time = `${Date.now() - start}ms`;
  // logger.info(`Loaded ${wiki.pages.length} wiki pages in ${time}`, {
  //   type: 'startup',
  // });

  // cron schedule to update messages
  schedule(PERSISTENT_MESSAGE_INTERVAL, () => updateMessages());

  // cron schedule to insert new api data into db
  schedule(DB_DATA_INTERVAL, () => dbData());

  // cron schedule to update api data every 10 seconds
  schedule(API_UPDATE_INTERVAL, () => {
    getData().then(data => {
      mappedNames.planets = data.Planets.map(x => x.name);
      mappedNames.campaignPlanets = data.Campaigns.map(x => x.planetName);
    });
  });

  // cron schedule to compare api data
  schedule(COMPARE_INTERVAL, () => compareData());

  // cron schedule to update presence every 3 seconds
  schedule(STATUS_UPDATE_INTERVAL, () => {
    if (client.user) {
      if (client.user.presence.activities[0]) {
        const prev = client.user.presence.activities[0].name;
        client.user.setActivity(presenceCmds.shift() as string, {
          type: ActivityType.Listening,
        });
        presenceCmds.push(prev);
      } else
        client.user.setActivity(presenceCmds.shift() as string, {
          type: ActivityType.Listening,
        });
    }
  });

  // update messages on startup only in a dev environment
  if (!isProd) await updateMessages();
};

export {onReady};
