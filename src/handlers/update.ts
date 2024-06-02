import {InteractionEditReplyOptions} from 'discord.js';
import {and, eq} from 'drizzle-orm';
import {config, isProd} from '../config';
import {db, persistentMessages} from '../db';
import {client} from './client';
import {warStatusEmbeds} from './embed';
import {logger} from './logging';
import {summaryRow} from './embeds';

export async function updateMessages() {
  const start = Date.now();

  const updateMessage: Record<string, InteractionEditReplyOptions> = {
    war_status: {
      ...(await warStatusPersistentMessage()),
    },
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
      .edit(message.messageId, updateMessage[message.type])
      .catch(err => {
        logger.info(`Error updating message: ${err.message}`, {
          type: 'update',
          ...err,
        });
        db.delete(persistentMessages)
          .where(eq(persistentMessages.messageId, message.messageId))
          .catch();
        return null;
      });
  });

  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  await Promise.allSettled(updatePromises);

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

  const summaryEmbeds = await warStatusEmbeds();
  let {description} = summaryEmbeds[summaryEmbeds.length - 1].data;
  description += `\n\nThis message is updated every 30 minutes! It was last updated <t:${timestamp}:R>.`;
  summaryEmbeds[summaryEmbeds.length - 1].setDescription(description ?? null);

  return {embeds: summaryEmbeds, components: [summaryRow]};
}
