import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionEditReplyOptions,
} from 'discord.js';
import {and, eq} from 'drizzle-orm';
import {config, isProd} from '../config';
import {db, persistentMessages} from '../db';
import {client} from './client';
import {warStatusEmbeds} from './embed';
import {logger} from './logging';

const SUBSCRIBE_FOOTER = config.SUBSCRIBE_FOOTER;
const DISCORD_INVITE = config.DISCORD_INVITE;
const HD_COMPANION_LINK = config.HD_COMPANION_LINK;

let isUpdateInProgress = false;

export async function updateMessages() {
  if (isUpdateInProgress) {
    logger.info('Update already in progress, skipping', {type: 'update'});
    return;
  }
  isUpdateInProgress = true;

  const start = Date.now();
  const warStatusEmbeds = await warStatusPersistentMessage();
  let {description} = warStatusEmbeds[warStatusEmbeds.length - 1].data;
  description += `\n\nFor support, suggestions, or to report bugs pertaining to the bot, join the [HellCom Support Discord](${DISCORD_INVITE})!`;
  description += `\n\nFor more detailed information about the war, visit the [Helldivers Companion website](${HD_COMPANION_LINK})!`;
  warStatusEmbeds[warStatusEmbeds.length - 1].setDescription(
    description ?? null
  );

  const updateMessage: Record<string, InteractionEditReplyOptions> = {
    war_status: {
      embeds: warStatusEmbeds,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setLabel('HellCom Support Discord')
            .setEmoji('<:hellcom:1232123669560430693>')
            .setStyle(ButtonStyle.Link)
            .setURL(DISCORD_INVITE),
          new ButtonBuilder()
            .setLabel('Helldivers Companion')
            .setEmoji('<:helldiverscompanion:1232123938394607656>')
            .setStyle(ButtonStyle.Link)
            .setURL(HD_COMPANION_LINK),
        ]),
      ],
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
