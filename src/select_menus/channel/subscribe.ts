import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ChannelType,
  DiscordAPIError,
  EmbedBuilder,
} from 'discord.js';
import {
  announcementChannels,
  db,
  newAnnouncementChannel,
  newPersistentMessage,
  persistentMessages,
} from '../../db';
import {EMBED_COLOUR, FOOTER_MESSAGE} from '../../commands/_components';
import {
  client,
  subHighlightsNotifEmbed,
  subNotifRemoveSuccessEmbed,
  subscribeFailureEmbed,
  subStatusAddSuccessEmbed,
  subStatusRemoveSuccessEmbed,
  subUpdatesAddSuccessEmbed,
  subUpdatesNotifEmbed,
  warStatusPersistentMessage,
} from '../../handlers';
import {isProd} from '../../config';
import {and, eq} from 'drizzle-orm';

const handle = async (
  interaction: ChannelSelectMenuInteraction
): Promise<void> => {
  const {customId} = interaction;
  const subscription = customId.split('-')[1];

  await subscriptions[subscription](interaction);
};

const subscriptions: {
  [key: string]: (job: ChannelSelectMenuInteraction) => Promise<void>;
} = {
  status_add: statusAdd,
  status_remove: statusRemove,
  updates_add: updatesAdd,
  updates_remove: updatesRemove,
  highlights_add: highlightsAdd,
  highlights_remove: highlightsRemove,
};

async function statusAdd(interaction: ChannelSelectMenuInteraction) {
  const channel = await client.channels.fetch(interaction.values[0]);
  if (
    !channel ||
    !(
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.PublicThread ||
      channel.type === ChannelType.GuildAnnouncement ||
      channel.type === ChannelType.AnnouncementThread
    )
  ) {
    // TODO: add error handling
    return;
  }

  // check whether this guild already has a persistent message
  const existing = await db.query.persistentMessages.findMany({
    where: and(
      eq(persistentMessages.guildId, interaction.guildId ?? ''),
      eq(persistentMessages.type, 'war_status'),
      eq(persistentMessages.deleted, false),
      eq(persistentMessages.production, isProd)
    ),
  });
  if (existing.map(m => m.channelId).includes(channel.id)) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Channel Already Subscribed')
          .setDescription(
            'This selected channel is already subscribed to war status updates! ' +
              'To prevent spam, only one subscription (excluding status) per channel is allowed. ' +
              'Feel free to enable this subscription in other channels, or to enable another subscription in this channel!' +
              '\n\nIf you would like to remove the subscription, use the `/subscribe` command again, and select the "**Remove**" option.'
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR)
          .setTimestamp(),
      ],
      components: [],
    });

    return;
  }

  // try to update interaction reply via message API to check permissions
  try {
    const message = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTitle('Testing Permissions...')
          .setDescription(
            'Checking if this can be updated in the future...\n\n' +
              'If this message does not change, then the bot is missing the following permissions for this channel:\n' +
              '- View Channel\n' +
              '- Embed Links'
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR)
          .setTimestamp(),
      ],
    });

    const messageChannel = await client.channels.fetch(message.channelId);
    if (
      messageChannel &&
      (messageChannel.type === ChannelType.GuildText ||
        messageChannel.type === ChannelType.PublicThread ||
        messageChannel.type === ChannelType.GuildAnnouncement ||
        messageChannel.type === ChannelType.AnnouncementThread)
    ) {
      const discordMsg = await messageChannel.messages.fetch(message.id);
      if (discordMsg) await discordMsg.edit(await warStatusPersistentMessage());

      // if edit succeeds, then create db entry to update the message in future
      await newPersistentMessage({
        messageId: message.id,
        channelId: message.channelId,
        type: 'war_status',
        userId: interaction.user.id,
        guildId: message.guild?.id || '',
        production: isProd,
      });
      const {embeds, components} = subStatusAddSuccessEmbed(discordMsg);
      await interaction.editReply({embeds, components});
    }

    return;
  } catch (err) {
    // Discord API rejects the request if bot doesn't have perms for the channel
    await interaction.editReply(
      subscribeFailureEmbed('status', interaction, err as DiscordAPIError)
    );
  }
  return;
}

async function statusRemove(interaction: ChannelSelectMenuInteraction) {
  const queryOpts = {
    where: and(
      eq(persistentMessages.guildId, interaction.guildId || ''),
      eq(persistentMessages.type, 'war_status'),
      eq(persistentMessages.channelId, interaction.values[0]),
      eq(persistentMessages.production, isProd)
    ),
  };
  const message = await db.query.persistentMessages.findFirst(queryOpts);
  if (!message) {
    const embed = new EmbedBuilder()
      .setTitle('No Subscription Found!')
      .setDescription(
        `<#${interaction.values[0]}> is not subscribed to war status updates. If this was a mistake you may select another channel below.`
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp();
    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('subscribe-status_remove')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.PublicThread,
          ChannelType.GuildAnnouncement,
          ChannelType.AnnouncementThread
        )
    );
    await interaction.editReply({embeds: [embed], components: [row]});
    return;
  }

  await db.delete(persistentMessages).where(queryOpts.where);
  let deleted = false;
  try {
    const messageChannel = await client.channels.fetch(message.channelId);
    if (
      messageChannel &&
      (messageChannel.type === ChannelType.GuildText ||
        messageChannel.type === ChannelType.PublicThread ||
        messageChannel.type === ChannelType.GuildAnnouncement ||
        messageChannel.type === ChannelType.AnnouncementThread)
    ) {
      await (await messageChannel.messages.fetch(message.messageId)).delete();
      deleted = true;
    }
  } catch (e) {
    deleted = false;
  }
  await interaction.editReply(subStatusRemoveSuccessEmbed(message, deleted));
  return;
}

async function updatesAdd(interaction: ChannelSelectMenuInteraction) {
  const channel = await client.channels.fetch(interaction.values[0]);
  if (
    !channel ||
    !(
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.PublicThread ||
      channel.type === ChannelType.GuildAnnouncement ||
      channel.type === ChannelType.AnnouncementThread
    )
  ) {
    // TODO: add error handling
    return;
  }

  const existing = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId ?? ''),
      // eq(announcementChannels.type, 'war_announcements'),
      eq(persistentMessages.production, isProd)
    ),
  });
  if (existing.map(m => m.channelId).includes(channel.id)) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Channel Already Subscribed')
          .setDescription(
            'The selected channel already has an active subscription! ' +
              'To prevent spam, only one subscription (excluding status) per channel is allowed. ' +
              'Feel free to enable this subscription in other channels, or to enable another subscription in this channel!' +
              '\n\nIf you would like to remove the subscription, use the `/subscribe` command again, and select the "**Remove**" option.'
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR)
          .setTimestamp(),
      ],
      components: [],
    });

    return;
  }

  try {
    const message = await channel.send(subUpdatesNotifEmbed());

    // if edit succeeds, then create db entry to update the message in future
    await newAnnouncementChannel({
      channelId: channel.id,
      type: 'war_announcements',
      userId: interaction.user.id,
      guildId: interaction.guild?.id || '',
      production: isProd,
    });

    await interaction.editReply(subUpdatesAddSuccessEmbed(message));
  } catch (err) {
    // Discord API rejects the request if bot doesn't have perms for the channel
    await interaction.editReply(
      subscribeFailureEmbed('status', interaction, err as DiscordAPIError)
    );
  }
  return;
}

async function updatesRemove(interaction: ChannelSelectMenuInteraction) {
  const queryOpts = {
    where: and(
      eq(announcementChannels.guildId, interaction.guildId || ''),
      eq(announcementChannels.type, 'war_announcements'),
      eq(announcementChannels.channelId, interaction.values[0]),
      eq(announcementChannels.production, isProd)
    ),
  };
  const channel = await db.query.announcementChannels.findFirst(queryOpts);
  if (!channel) {
    const embed = new EmbedBuilder()
      .setTitle('No Subscription Found!')
      .setDescription(
        `<#${interaction.values[0]}> is not subscribed to war update announcements. If this was a mistake you may select another channel below.`
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp();
    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('subscribe-updates_remove')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.PublicThread,
          ChannelType.GuildAnnouncement,
          ChannelType.AnnouncementThread
        )
    );
    await interaction.editReply({embeds: [embed], components: [row]});
    return;
  }

  await db.delete(announcementChannels).where(queryOpts.where);
  await interaction.editReply(subNotifRemoveSuccessEmbed(channel));
  return;
}

async function highlightsAdd(interaction: ChannelSelectMenuInteraction) {
  const channel = await client.channels.fetch(interaction.values[0]);
  if (
    !channel ||
    !(
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.PublicThread ||
      channel.type === ChannelType.GuildAnnouncement ||
      channel.type === ChannelType.AnnouncementThread
    )
  ) {
    // TODO: add error handling
    return;
  }

  const existing = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId ?? ''),
      // eq(announcementChannels.type, 'war_highlights'),
      eq(persistentMessages.production, isProd)
    ),
  });
  if (existing.map(m => m.channelId).includes(channel.id)) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Channel Already Subscribed')
          .setDescription(
            'The selected channel already has an active subscription! ' +
              'To prevent spam, only one subscription (excluding status) per channel is allowed. ' +
              'Feel free to enable this subscription in other channels, or to enable another subscription in this channel!' +
              '\n\nIf you would like to remove the subscription, use the `/subscribe` command again, and select the "**Remove**" option.'
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR)
          .setTimestamp(),
      ],
      components: [],
    });

    return;
  }

  try {
    const message = await channel.send(subHighlightsNotifEmbed());

    // if edit succeeds, then create db entry to update the message in future
    await newAnnouncementChannel({
      channelId: channel.id,
      type: 'war_highlights',
      userId: interaction.user.id,
      guildId: interaction.guild?.id || '',
      production: isProd,
    });

    await interaction.editReply(subUpdatesAddSuccessEmbed(message));
  } catch (err) {
    // Discord API rejects the request if bot doesn't have perms for the channel
    await interaction.editReply(
      subscribeFailureEmbed('highlights', interaction, err as DiscordAPIError)
    );
  }
  return;
}

async function highlightsRemove(interaction: ChannelSelectMenuInteraction) {
  const queryOpts = {
    where: and(
      eq(announcementChannels.guildId, interaction.guildId || ''),
      eq(announcementChannels.type, 'war_highlights'),
      eq(announcementChannels.channelId, interaction.values[0]),
      eq(announcementChannels.production, isProd)
    ),
  };
  const channel = await db.query.announcementChannels.findFirst(queryOpts);
  if (!channel) {
    const embed = new EmbedBuilder()
      .setTitle('No Subscription Found!')
      .setDescription(
        `<#${interaction.values[0]}> is not subscribed to war update announcements. If this was a mistake you may select another channel below.`
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp();
    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('subscribe-highlights_remove')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.PublicThread,
          ChannelType.GuildAnnouncement,
          ChannelType.AnnouncementThread
        )
    );
    await interaction.editReply({embeds: [embed], components: [row]});
    return;
  }

  await db.delete(announcementChannels).where(queryOpts.where);
  await interaction.editReply(subNotifRemoveSuccessEmbed(channel));
  return;
}

export default handle;
