import {EmbedBuilder} from 'discord.js';
import {and, eq} from 'drizzle-orm';
import {config, isProd} from '../config';
import {db, persistentMessages} from '../db';
import {client} from './client';
import {warStatusEmbeds} from './embed';
import {logger} from './logging';

const SUBSCRIBE_FOOTER = config.SUBSCRIBE_FOOTER;

let isUpdateInProgress = false;

export async function updateMessages() {
  if (isUpdateInProgress) {
    logger.info('Update already in progress, skipping', {type: 'update'});
    return;
  }
  isUpdateInProgress = true;

  const start = Date.now();
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

  const channelFetchPromises = messages.map(message =>
    client.channels.fetch(message.channelId).catch(() => null)
  );
  const channels = await Promise.all(channelFetchPromises);

  const updatePromises = messages.map((message, index) => {
    const channel = channels[index];
    if (!channel || !channel.isTextBased()) return null;

    return channel.messages
      .edit(message.messageId, {
        embeds: embeds[message.type],
      })
      .catch(err => {
        logger.error(`Error updating message: ${err.message}`, {
          type: 'update',
          ...err,
        });
        return null;
      });
  });

  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  await Promise.allSettled(updatePromises);
  isUpdateInProgress = false;

  const taken = `${(Date.now() - start).toLocaleString()}ms`;
  logger.info(
    `Updated ${updatePromises.length} persistent messages in ${taken}`,
    {
      type: 'update',
    }
  );
}

export async function warStatusPersistentMessage() {
  const timestamp = Math.round(Date.now() / 1000);

  const updateEmbed = new EmbedBuilder()
    .setDescription(
      `This message is updated every 30 minutes! It was last updated <t:${timestamp}:R>.`
    )
    .setFooter({text: SUBSCRIBE_FOOTER})
    .setTimestamp();

  return [...(await warStatusEmbeds()), updateEmbed];
}
