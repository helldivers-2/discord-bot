import {DiscordAPIError, EmbedBuilder, TextBasedChannel} from 'discord.js';
import {and, eq} from 'drizzle-orm';
import {config, isProd} from '../config';
import {db, persistentMessages} from '../db';
import {client} from './client';
import {warStatusEmbeds} from './embed';
import {logger} from './logging';

const SUBSCRIBE_FOOTER = config.SUBSCRIBE_FOOTER;

export async function updateMessages() {
  const embeds = {
    curr_war: await warStatusPersistentMessage(),
  };

  const messages = await db.query.persistentMessages.findMany({
    where: and(
      eq(persistentMessages.deleted, false),
      eq(persistentMessages.production, isProd)
    ),
  });
  logger.info(`Updating ${messages.length} persistent messages`, {
    type: 'update',
  });
  // const promises: Promise<any>[] = [];
  for (const message of messages) {
    const {messageId, channelId, type: messageType} = message;

    try {
      // try fetching the channel, may throw '50001', bot can't see channel
      const messageChannel = await client.channels.fetch(channelId, {
        // https://old.discordjs.dev/#/docs/discord.js/14.14.1/typedef/FetchChannelOptions
        allowUnknownGuild: true,
      });

      if (messageChannel && messageChannel.isTextBased()) {
        const textChannel = messageChannel as TextBasedChannel;
        const discordMsg = await textChannel.messages.fetch(messageId);

        if (discordMsg) {
          switch (messageType) {
            case 'war_status':
              discordMsg.edit({
                embeds: embeds.curr_war,
              });
              break;
          }
        }
      }
    } catch (err) {
      logger.warn(err);
      const discordErr = err as DiscordAPIError;
      // discord API error codes
      // https://github.com/meew0/discord-api-docs-1/blob/master/docs/topics/RESPONSE_CODES.md#json-error-response
      logger.warn(`Error updating message: ${discordErr.message}`, {
        type: 'update',
        ...discordErr,
      });
      // switch (discordErr.code) {
      //   case 10003: // Unknown channel
      //     promises.push(
      //       db
      //         .delete(persistentMessages)
      //         .where(
      //           and(
      //             eq(persistentMessages.messageId, messageId),
      //             eq(persistentMessages.production, isProd)
      //           )
      //         )
      //     );
      //     break;
      //   case 10008: // Unknown message
      //     promises.push(
      //       db
      //         .delete(persistentMessages)
      //         .where(
      //           and(
      //             eq(persistentMessages.messageId, messageId),
      //             eq(persistentMessages.production, isProd)
      //           )
      //         )
      //     );
      //     break;
      //   case 50001: // Missing access
      //     promises.push(
      //       db
      //         .delete(persistentMessages)
      //         .where(
      //           and(
      //             eq(persistentMessages.messageId, messageId),
      //             eq(persistentMessages.production, isProd)
      //           )
      //         )
      //     );
      //     break;
      //   case 50005: // Cannot edit a message authored by another user
      //     break;
      // }
    }
  }
}

export async function warStatusPersistentMessage() {
  const timestamp = Math.round(Date.now() / 1000);

  const updateEmbed = new EmbedBuilder()
    .setDescription(
      `This message is updated every 15 minutes! It was last updated <t:${timestamp}:R>.`
    )
    .setFooter({text: SUBSCRIBE_FOOTER})
    .setTimestamp();

  return [...(await warStatusEmbeds()), updateEmbed];
}
