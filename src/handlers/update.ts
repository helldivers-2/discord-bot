import {DiscordAPIError, EmbedBuilder, TextBasedChannel} from 'discord.js';
import {and, eq} from 'drizzle-orm';
import {config, isProd} from '../config';
import {db, persistentMessages} from '../db';
import {client} from './client';
import {warStatusEmbeds} from './embed';
import {logger} from './logging';

const SUBSCRIBE_FOOTER = config.SUBSCRIBE_FOOTER;

export async function updateMessages() {
  const embeds: Record<string, EmbedBuilder[]> = {
    war_status: await warStatusPersistentMessage(),
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
    logger.info(`Attempting to update message ${messageId}`, {
      ...message,
      message_type: messageType,
      type: 'update',
    });

    try {
      // try fetching the channel, may throw '50001', bot can't see channel
      const channel = await client.channels.fetch(channelId, {
        // https://old.discordjs.dev/#/docs/discord.js/14.14.1/typedef/FetchChannelOptions
        // allowUnknownGuild: true,
        // force: true,
      });
      if (!channel) {
        logger.info(`Channel not found: ${channelId}`, {
          ...message,
          message_type: messageType,
          type: 'update',
        });
        continue;
      }
      if (channel.isTextBased()) {
        const msg = await channel.messages.edit(messageId, {
          embeds: embeds[messageType],
        });
        logger.info(
          `Successfully updated message ${msg.id} in ${msg.channel.id}`,
          {
            ...message,
            message_type: messageType,
            type: 'update',
          }
        );
      } else
        logger.info(`Channel not text-based: ${channelId}`, {
          ...message,
          message_type: messageType,
          type: 'update',
        });
    } catch (err) {
      logger.error(err);
      const discordErr = err as DiscordAPIError;
      // discord API error codes
      // https://github.com/meew0/discord-api-docs-1/blob/master/docs/topics/RESPONSE_CODES.md#json-error-response
      logger.error(`Error updating message: ${discordErr.message}`, {
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
