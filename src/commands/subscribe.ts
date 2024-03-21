import {
  ChannelType,
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {EMBED_COLOUR, FOOTER_MESSAGE} from './_components';
import {
  client,
  subscribeEmbed,
  subscribeNotifEmbed,
  warStatusPersistentMessage,
} from '../handlers';
import {isProd} from '../config';
import {
  announcementChannels,
  db,
  eq,
  newAnnouncementChannel,
  newPersistentMessage,
  persistentMessages,
} from '../db';
import {and} from 'drizzle-orm';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Subscribe to notifications for a specific event.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Display current galactic war status.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription(
          "Remove a guild's subscription to a specific event type."
        )
        .addStringOption(option =>
          option
            .setName('event')
            .setDescription('Event type to unsubscribe')
            .setRequired(true)
            .setChoices(
              {name: 'War Status', value: 'war_status'},
              {name: 'War Announcements', value: 'war_announcements'}
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('updates')
        .setDescription(
          'Subscribes a specified channel to updates for the galactic war'
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Forum channel to add to the recognised list')
            .setRequired(true)
        )
    ),

  run: async interaction => {
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  status,
  remove,
  updates,
};

async function remove(interaction: CommandInteraction) {
  const event = interaction.options.get('event', true).value as string;

  if (event === 'war_status') {
    const message = await db.query.persistentMessages.findFirst({
      where: and(
        eq(persistentMessages.guildId, interaction.guildId || ''),
        eq(persistentMessages.type, event),
        eq(persistentMessages.production, isProd)
      ),
    });

    if (!message) {
      const embed = new EmbedBuilder()
        .setTitle('No Subscription Found!')
        .setDescription(`This guild is not subscribed to ${event} events.`)
        .setFooter({text: FOOTER_MESSAGE})
        .setTimestamp();

      await interaction.editReply({embeds: [embed]});

      return;
    }

    await db
      .delete(persistentMessages)
      .where(
        and(
          eq(persistentMessages.guildId, interaction.guildId || ''),
          eq(persistentMessages.type, event),
          eq(persistentMessages.production, isProd)
        )
      );

    const embed = new EmbedBuilder()
      .setTitle('Channel Unsubscribed!')
      .setDescription(
        `This guild is no longer subscribed to ${event} events. Attempting to delete the message. If this fails, feel free to delete it manually.`
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp();

    await interaction.editReply({embeds: [embed]});

    try {
      const messageChannel = await client.channels.fetch(message.channelId);
      if (
        messageChannel &&
        (messageChannel.type === ChannelType.GuildText ||
          messageChannel.type === ChannelType.PublicThread ||
          messageChannel.type === ChannelType.GuildAnnouncement ||
          messageChannel.type === ChannelType.AnnouncementThread)
      ) {
        const discordMsg = await messageChannel.messages.fetch(
          message.messageId
        );
        await discordMsg.delete();
      }
    } catch (e) {
      return;
    }

    return;
  } else if (event === 'war_announcements') {
    const channel = await db.query.announcementChannels.findFirst({
      where: and(
        eq(announcementChannels.guildId, interaction.guildId || ''),
        eq(announcementChannels.type, event),
        eq(announcementChannels.production, isProd)
      ),
    });

    if (!channel) {
      const embed = new EmbedBuilder()
        .setTitle('No Subscription Found!')
        .setDescription(`This guild is not subscribed to ${event} events.`)
        .setFooter({text: FOOTER_MESSAGE})
        .setTimestamp();

      await interaction.editReply({embeds: [embed]});

      return;
    }

    await db
      .delete(announcementChannels)
      .where(
        and(
          eq(announcementChannels.guildId, interaction.guildId || ''),
          eq(announcementChannels.type, event),
          eq(announcementChannels.production, isProd)
        )
      );

    const embed = new EmbedBuilder()
      .setTitle('Channel Unsubscribed!')
      .setDescription(
        `This guild is no longer subscribed to ${event} events. Attempting to delete the message. If this fails, feel free to delete it manually.`
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp();

    await interaction.editReply({embeds: [embed]});
  }
}

async function updates(interaction: CommandInteraction) {
  const channel = interaction.options.get('channel')?.value as string;
  const existing = await db.query.announcementChannels.findFirst({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId ?? ''),
      eq(announcementChannels.type, 'war_announcements'),
      eq(persistentMessages.production, isProd)
    ),
  });
  if (existing) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTitle('Guild Already Subscribed')
          .setDescription(
            'This guild is already subscribed to war announcements! ' +
              'To prevent spam, only one subscription per type per guild is allowed (feel free to use other subscribe types, however). ' +
              '\n\nIf you would like to remove the subscription, use the `/subscribe remove` command.'
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR)
          .setTimestamp(),
      ],
    });

    return;
  }

  try {
    const messageChannel = await interaction.guild?.channels.fetch(channel);
    if (
      messageChannel &&
      (messageChannel.type === ChannelType.GuildText ||
        messageChannel.type === ChannelType.PublicThread ||
        messageChannel.type === ChannelType.GuildAnnouncement ||
        messageChannel.type === ChannelType.AnnouncementThread)
    ) {
      await messageChannel.send({
        embeds: subscribeNotifEmbed('war_announcements'),
      });

      // if edit succeeds, then create db entry to update the message in future
      await newAnnouncementChannel({
        channelId: messageChannel.id,
        type: 'war_announcements',
        userId: interaction.user.id,
        guildId: interaction.guild?.id || '',
        production: isProd,
      });

      await interaction.editReply({
        embeds: subscribeEmbed('war_announcements', messageChannel),
      });
    }

    // API throws noaccess err if bot doesn't have perms for the channel
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTitle('Missing Permissions')
          .setDescription(
            `Bot requires \`View Channel\`, \`Send Messages\` and \`Embed Link\` permissions in <#${interaction.channelId}> for this command!`
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR as ColorResolvable)
          .setTimestamp(),
      ],
    });

    return;
  }
}

async function status(interaction: CommandInteraction) {
  // check whether this guild already has a persistent message
  const existingMessage = await db.query.persistentMessages.findFirst({
    where: and(
      eq(persistentMessages.guildId, interaction.guildId ?? ''),
      eq(persistentMessages.type, 'war_status'),
      eq(persistentMessages.deleted, false),
      eq(persistentMessages.production, isProd)
    ),
  });
  if (existingMessage) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTitle('Guild Already Subscribed')
          .setDescription(
            'This guild is already subscribed to war status updates! ' +
              'To prevent spam, only one subscription per type per guild is allowed (feel free to use other subscribe types, however). ' +
              '\n\nIf you would like to remove the subscription, use the `/subscribe remove` command.'
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR)
          .setTimestamp(),
      ],
    });

    return;
  }

  const channel = interaction.channel;
  if (!channel) return;

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
      if (discordMsg)
        await discordMsg.edit({
          embeds: await warStatusPersistentMessage(),
        });

      // if edit succeeds, then create db entry to update the message in future
      await newPersistentMessage({
        messageId: message.id,
        channelId: message.channelId,
        type: 'war_status',
        userId: interaction.user.id,
        guildId: message.guild?.id || '',
        production: isProd,
      });

      await interaction.editReply({
        embeds: subscribeEmbed('war_status', messageChannel),
      });
    }

    return;
    // API throws noaccess err if bot doesn't have perms for the channel
    // update interaction reply to reflect that, then remove it 10s later
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTitle('Missing Permissions')
          .setDescription(
            `Bot requires \`View Channel\`, \`Send Messages\` and \`Embed Link\` permissions in <#${interaction.channelId}> for this command!`
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR as ColorResolvable)
          .setTimestamp(),
      ],
    });

    return;
  }
}

export default command;
