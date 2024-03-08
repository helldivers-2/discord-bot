import {
  ActivityType,
  ChannelType,
  Client,
  DiscordAPIError,
  REST,
  Routes,
} from 'discord.js';
import {schedule} from 'node-cron';
import {commandHash, commandList, presenceCmds} from '../commands';
import {config, isProd} from '../config';
import {getData, mappedNames} from '../api-wrapper';
import {db, eq, persistentMessages} from '../db';
import {warStatusEmbeds} from '../handlers';

// bot client token, for use with discord API
const BOT_TOKEN = config.BOT_TOKEN;

const onReady = async (client: Client) => {
  if (!client.user) throw Error('Client not initialised');
  const clientId = client.user.id;
  const serverCount = (await client.guilds.fetch()).size;

  const rest = new REST().setToken(BOT_TOKEN);

  console.log(`Serving ${serverCount} servers as ${client.user?.tag}`);

  // two non-constant value for timing functions
  let start = Date.now();
  let time = '';

  // register commands as global discord slash commands
  const commandData = commandList.map(command => command.data.toJSON());
  await rest.put(Routes.applicationCommands(clientId), {
    body: commandData,
  });
  console.log(`Commands loaded: ${Object.keys(commandHash).join(', ')}`);

  time = `${Date.now() - start}ms`;
  console.log(`Loaded ${commandData.length} commands in ${time}`);

  // get api data on startup
  await getData().then(data => {
    mappedNames.planets = data[801].Planets.map(x => x.name);
    mappedNames.campaignPlanets = data[801].Campaigns.map(x => x.planetName);
  });

  // retrieve encounters and load them as autocomplete suggestions
  time = `${Date.now() - start}ms`;
  console.log(`Loaded ${mappedNames.planets.length} planets in ${time}`);

  // cron schedule to update messages every hour
  schedule('0 * * * *', async () => {
    // measure time taken to update all persistent messages
    start = Date.now();

    const embeds = {
      curr_war: warStatusEmbeds(),
    };

    const messages = await db.query.persistentMessages.findMany({
      where:
        eq(persistentMessages.deleted, false) &&
        eq(persistentMessages.production, isProd),
    });

    const promises: Promise<any>[] = [];
    for (const message of messages) {
      const {messageId, channelId, type: messageType} = message;

      try {
        // try fetching the channel, may throw '50001', bot can't see channel
        const messageChannel = await client.channels.fetch(channelId);
        if (
          messageChannel &&
          (messageChannel.type === ChannelType.GuildText ||
            messageChannel.type === ChannelType.PublicThread)
        ) {
          // try fetching the message, may throw '10008', message doesn't exist (deleted?)
          const discordMsg = await messageChannel.messages.fetch(messageId);
          if (discordMsg)
            switch (messageType) {
              case 'war_status':
                promises.push(
                  discordMsg.edit({
                    embeds: embeds.curr_war,
                  })
                );
                break;
            }
        }
      } catch (err) {
        const discordErr = err as DiscordAPIError;
        // discord API error codes
        // https://github.com/meew0/discord-api-docs-1/blob/master/docs/topics/RESPONSE_CODES.md#json-error-response
        switch (discordErr.code) {
          case 10003: // Unknown channel
            promises.push(
              db
                .update(persistentMessages)
                .set({deleted: true})
                .where(eq(persistentMessages.messageId, messageId))
            );
            break;
          case 10008: // Unknown message
            promises.push(
              db
                .update(persistentMessages)
                .set({deleted: true})
                .where(eq(persistentMessages.messageId, messageId))
            );
            break;
          case 50001: // Missing access
            promises.push(
              db
                .update(persistentMessages)
                .set({deleted: true})
                .where(eq(persistentMessages.messageId, messageId))
            );
            break;
          case 50005: // Cannot edit a message authored by another user
            break;
        }
      }
    }

    // await all message edits completion
    await Promise.all(promises);
    time = `${Date.now() - start}ms`;
    console.log(`Updated ${messages.length} messages in ${time}`);
  });

  // cron schedule to update api data every 10 seconds
  schedule('*/10 * * * * *', () => {
    getData().then(data => {
      mappedNames.planets = data[801].Planets.map(x => x.name);
      mappedNames.campaignPlanets = data[801].Campaigns.map(x => x.planetName);
    });
  });

  // cron schedule to update presence every 3 seconds
  schedule('*/3 * * * * *', () => {
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
};

export {onReady};
