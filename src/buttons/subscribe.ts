import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import {subscribeEmbed} from '../handlers';
import {announcementChannels, db, eq, persistentMessages} from '../db';
import {and} from 'drizzle-orm';
import {isProd} from '../config';

const button = async (interaction: ButtonInteraction): Promise<void> => {
  const {customId} = interaction;
  // first index is the command, so we can ignore it
  const subscription = customId.split('-')[1];

  await subscriptions[subscription](interaction);
};

const subscriptions: {
  [key: string]: (job: ButtonInteraction) => Promise<void>;
} = {
  back: back,
  status: status,
  status_add: statusAdd,
  status_remove: statusRemove,
  updates: updates,
  updates_add: updatesAdd,
  updates_remove: updatesRemove,
  highlights: highlights,
  highlights_add: highlightsAdd,
  highlights_remove: highlightsRemove,
};

async function back(interaction: ButtonInteraction) {
  const {embeds, components} = await subscribeEmbed(interaction);

  await interaction.editReply({embeds, components});
}

async function status(interaction: ButtonInteraction) {
  // fetch the server's subscriptions
  const warStatus = await db.query.persistentMessages.findMany({
    where: and(
      eq(persistentMessages.guildId, interaction.guildId || ''),
      eq(persistentMessages.type, 'war_status'),
      eq(persistentMessages.production, isProd)
    ),
  });
  const embed = new EmbedBuilder()
    .setTitle('War Status')
    .setDescription(
      'HellCom will send one message in a channel of your choice with a summarised overview of the war status. It displays this information in an easy-to-read format using a few embeds and will edit that same message with updated information every 30 minutes!' +
        '\n\n' +
        'Some popular ways of utilising this are:\n' +
        '- Creating a read-only channel with only the status message, so the information is easy to access in a Helldivers-interested Discord.\n' +
        '- Pinning the status message in a Helldivers 2 channel or thread, if the server does not have a large interest in Helldivers\n' +
        '*These are merely suggestions, feel free to use HellCom as you see fit!*' +
        '\n\n' +
        'In the selected channel, HellCom will then attempt to post and edit a message; If this fails, it will tell you the issue it encountered.' +
        '\n\n' +
        'Below lists the Discord permissions needed for this feature to work (enable these for HellCom in the channel):' +
        '\n' +
        '- `View Channel`\n' +
        '- `Send Messages`\n' +
        '- `Embed Links`\n' +
        '- `Use External Emojis`\n' +
        "__None of these permission allows HellCom to read messages or channel information. It can only access *it's own messages and edit them*__."
    );
  if (warStatus.length > 0) {
    embed.addFields({
      name: 'Subscriptions',
      value:
        warStatus
          .map(
            s =>
              `- https://discord.com/channels/${s.guildId}/${s.channelId}/${s.messageId}`
          )
          .join('\n') +
        "\nUse the following buttons to manage this server's subscriptions!",
      inline: false,
    });
  } else {
    embed.addFields({
      name: '\u200b',
      value:
        'This server does not have any war summary status messages. Use the following button to create one if the feature interests you!',
    });
  }
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('subscribe-status_add')
      .setLabel('Add')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('subscribe-status_remove')
      .setLabel('Remove')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(warStatus.length === 0),
    new ButtonBuilder()
      .setCustomId('subscribe-back')
      .setLabel('Back')
      .setStyle(ButtonStyle.Primary)
  );
  await interaction.editReply({embeds: [embed], components: [row]});
}

async function updates(interaction: ButtonInteraction) {
  const warUpdates = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId || ''),
      // eq(announcementChannels.type, 'war_announcements'),
      eq(announcementChannels.production, isProd)
    ),
  });
  const embed = new EmbedBuilder()
    .setTitle('War Updates')
    .setDescription(
      'HellCom will send important war updates as new messages in a channel of your choice. These updates are real-time, delivered to Discord right as they happen in-game. These war updates include campaign victories and losses, new campaigns, in-game events such as additional stratagems, major orders, and more!' +
        '\n\n' +
        'Some popular ways of utilising this are:\n' +
        '- Subscribing a Helldivers 2 channel or thread where members can also talk, allowing war updates to be a conversation starter.\n' +
        '- Creating a read-only channel dedicated to war updates, allowing that channel to serve as a log of Helldivers events for future reference or catching up after a break.\n' +
        '*These are merely suggestions, feel free to use HellCom as you see fit!*' +
        '\n\n' +
        'In the selected channel, HellCom will then attempt to post a message; If this fails, it will tell you the issue it encountered.' +
        '\n\n' +
        'Below lists the Discord permissions needed for this feature to work (enable these for HellCom in the channel):' +
        '\n' +
        '- `View Channel`\n' +
        '- `Send Messages`\n' +
        '- `Embed Links`\n' +
        '- `Use External Emojis`\n' +
        "__None of these permission allows HellCom to read messages or channel information. It can only access *it's own messages and edit them*__."
    );
  if (warUpdates.length > 0) {
    embed.addFields({
      name: 'Subscriptions',
      value:
        warUpdates
          .map(
            s =>
              `- https://discord.com/channels/${s.guildId}/${s.channelId} (${s.type})`
          )
          .join('\n') +
        "\nUse the following buttons to manage this server's subscriptions!",
      inline: false,
    });
  } else {
    embed.addFields({
      name: '\u200b',
      value:
        'This server does not have any channels with war updates enabled. Use the following button to enable it if the feature interests you!',
    });
  }
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('subscribe-updates_add')
      .setLabel('Add')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('subscribe-updates_remove')
      .setLabel('Remove')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(warUpdates.length === 0),
    new ButtonBuilder()
      .setCustomId('subscribe-back')
      .setLabel('Back')
      .setStyle(ButtonStyle.Primary)
  );
  await interaction.editReply({embeds: [embed], components: [row]});
  return;
}

async function highlights(interaction: ButtonInteraction) {
  const warUpdates = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId || ''),
      // eq(announcementChannels.type, 'war_highlights'),
      eq(announcementChannels.production, isProd)
    ),
  });
  const embed = new EmbedBuilder()
    .setTitle('War Highlights')
    .setDescription(
      'HellCom will send war highlights as new messages in a channel of your choice. These updates are real-time, delivered to Discord right as they happen in-game. These war highlights are primarily major orders and other important information!' +
        '\n\n' +
        'Some popular ways of utilising this are:\n' +
        '- Subscribing a Helldivers 2 channel or thread where members can also talk, allowing war updates to be a conversation starter.\n' +
        '- Creating a read-only channel dedicated to war updates, allowing that channel to serve as a log of Helldivers events for future reference or catching up after a break.\n' +
        '*These are merely suggestions, feel free to use HellCom as you see fit!*' +
        '\n\n' +
        'In the selected channel, HellCom will then attempt to post a message; If this fails, it will tell you the issue it encountered.' +
        '\n\n' +
        'Below lists the Discord permissions needed for this feature to work (enable these for HellCom in the channel):' +
        '\n' +
        '- `View Channel`\n' +
        '- `Send Messages`\n' +
        '- `Embed Links`\n' +
        '- `Use External Emojis`\n' +
        "__None of these permission allows HellCom to read messages or channel information. It can only access *it's own messages and edit them*__."
    );
  if (warUpdates.length > 0) {
    embed.addFields({
      name: 'Subscriptions',
      value:
        warUpdates
          .map(
            s =>
              `- https://discord.com/channels/${s.guildId}/${s.channelId} (${s.type})`
          )
          .join('\n') +
        "\nUse the following buttons to manage this server's subscriptions!",
      inline: false,
    });
  } else {
    embed.addFields({
      name: '\u200b',
      value:
        'This server does not have any channels with war highlights enabled. Use the following button to enable it if the feature interests you!',
    });
  }
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('subscribe-highlights_add')
      .setLabel('Add')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('subscribe-highlights_remove')
      .setLabel('Remove')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(warUpdates.length === 0),
    new ButtonBuilder()
      .setCustomId('subscribe-back')
      .setLabel('Back')
      .setStyle(ButtonStyle.Primary)
  );
  await interaction.editReply({embeds: [embed], components: [row]});
  return;
}

async function statusAdd(interaction: ButtonInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('Enable War Status')
    .setDescription(
      'Select a channel using the dropdown below to enable war status updates!' +
        '\n\n' +
        'Below lists the Discord permissions needed for this feature to work (enable these for HellCom in the channel):' +
        '\n' +
        '- `View Channel`\n' +
        '- `Send Messages`\n' +
        '- `Embed Links`\n' +
        '- `Use External Emojis`\n' +
        "__None of these permission allows HellCom to read messages or channel information. It can only access *it's own messages and edit them*__."
    );
  const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('subscribe-status_add')
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

async function statusRemove(interaction: ButtonInteraction) {
  const warStatus = await db.query.persistentMessages.findMany({
    where: and(
      eq(persistentMessages.guildId, interaction.guildId || ''),
      // eq(persistentMessages.type, 'war_status'),
      eq(persistentMessages.production, isProd)
    ),
  });
  const embed = new EmbedBuilder()
    .setTitle('War Updates')
    .setDescription(
      "\nDisable a channel's war status subscription using the dropdown below!" +
        '\n\n' +
        'HellCom will attempt to delete the message in the selected channel; If this fails, feel free to delete it yourself!'
    );
  embed.addFields({
    name: 'Subscriptions',
    value: warStatus
      .map(
        s =>
          `- https://discord.com/channels/${s.guildId}/${s.channelId} (${s.type})`
      )
      .join('\n'),
    inline: false,
  });

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

async function updatesAdd(interaction: ButtonInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('Enable War Status')
    .setDescription(
      'Select a channel using the dropdown below to enable war updates messages!' +
        '\n\n' +
        'Below lists the Discord permissions needed for this feature to work (enable these for HellCom in the channel):' +
        '\n' +
        '- `View Channel`\n' +
        '- `Send Messages`\n' +
        '- `Embed Links`\n' +
        '- `Use External Emojis`\n' +
        "__None of these permission allows HellCom to read messages or channel information. It can only access *it's own messages and edit them*__."
    );
  const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('subscribe-updates_add')
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

async function updatesRemove(interaction: ButtonInteraction) {
  const warUpdates = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId || ''),
      eq(announcementChannels.type, 'war_announcements'),
      eq(announcementChannels.production, isProd)
    ),
  });
  const embed = new EmbedBuilder()
    .setTitle('War Updates')
    .setDescription(
      "\nDisable a channel's war status subscription using the dropdown below!"
    );
  embed.addFields({
    name: 'Subscriptions',
    value: warUpdates
      .map(s => `- https://discord.com/channels/${s.guildId}/${s.channelId}`)
      .join('\n'),
    inline: false,
  });

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

async function highlightsAdd(interaction: ButtonInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('Enable War Highlights')
    .setDescription(
      'Select a channel using the dropdown below to enable war highlight messages!' +
        '\n\n' +
        'Below lists the Discord permissions needed for this feature to work (enable these for HellCom in the channel):' +
        '\n' +
        '- `View Channel`\n' +
        '- `Send Messages`\n' +
        '- `Embed Links`\n' +
        '- `Use External Emojis`\n' +
        "__None of these permission allows HellCom to read messages or channel information. It can only access *it's own messages and edit them*__."
    );
  const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('subscribe-highlights_add')
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

async function highlightsRemove(interaction: ButtonInteraction) {
  const warUpdates = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId || ''),
      // eq(announcementChannels.type, 'war_highlights'),
      eq(announcementChannels.production, isProd)
    ),
  });
  const embed = new EmbedBuilder()
    .setTitle('War Highlights')
    .setDescription(
      "\nDisable a channel's war highlight subscription using the dropdown below!"
    );
  embed.addFields({
    name: 'Subscriptions',
    value: warUpdates
      .map(
        s =>
          `- https://discord.com/channels/${s.guildId}/${s.channelId} (${s.type})`
      )
      .join('\n'),
    inline: false,
  });

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

export default button;
