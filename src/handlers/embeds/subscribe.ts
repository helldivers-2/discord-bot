import {announcementChannels, db, eq, persistentMessages} from '../../db';
import {and} from 'drizzle-orm';
import {isProd} from '../../config';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ColorResolvable,
  ChannelSelectMenuInteraction,
  Message,
  DiscordAPIError,
} from 'discord.js';
import {
  EMBED_COLOUR,
  FACTION_COLOUR,
  FOOTER_MESSAGE,
} from '../../commands/_components';
import {factionSprites, SUBSCRIBE_FOOTER} from './exports';
import {client} from '../client';

export async function subscribeEmbed(
  interaction: CommandInteraction | ButtonInteraction
) {
  const warStatus = await db.query.persistentMessages.findMany({
    where: and(
      eq(persistentMessages.guildId, interaction.guildId || ''),
      eq(persistentMessages.type, 'war_status'),
      eq(persistentMessages.production, isProd)
    ),
  });
  const warUpdates = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.guildId, interaction.guildId || ''),
      eq(announcementChannels.type, 'war_announcements'),
      eq(announcementChannels.production, isProd)
    ),
  });
  const embed = new EmbedBuilder()
    .setTitle('Subscription Management')
    .setFooter({text: FOOTER_MESSAGE});
  let fieldName = 'War Status';
  let fieldValue =
    'One message that is constantly updated with a summarised overview of the current war status. Uses a few embeds to display the information in a pleasant and easy-to-read format.';
  if (warStatus.length > 0) {
    fieldValue += '\n**Subscriptions (messages)**';
    for (const sub of warStatus) {
      const {guildId, channelId, messageId} = sub;
      fieldValue += `\n- https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
    }
  } else
    fieldValue +=
      '\n`This server does not have any war status subscriptions.`\n';
  embed.addFields({name: fieldName, value: fieldValue});

  fieldName = 'War Updates';
  fieldValue =
    'Select a channel to receive war updates. Updates are real-time, delivered alongside in-game events. Example updates include campaign victories/losses, new campaigns, in-game events, and more!';
  if (warUpdates.length > 0) {
    fieldValue += '\n**Subscriptions (channels)**';
    for (const sub of warUpdates) {
      fieldValue += `\n- <#${sub.channelId}>`;
    }
  } else
    fieldValue += '\n`This server does not have any war update subscriptions.`';
  embed.addFields({name: fieldName, value: fieldValue});

  embed.addFields({
    name: '\u200b',
    value:
      "**Use the following buttons to manage this server's subscriptions**!",
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('subscribe-status')
      .setLabel('War Status')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('subscribe-updates')
      .setLabel('War Updates')
      .setStyle(ButtonStyle.Success)
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

export function subStatusAddSuccessEmbed(message: Message<true>) {
  const embeds = [];
  const msgLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: client.user?.username || 'HellCom',
      iconURL: client.user?.avatarURL() || undefined,
    })
    .setTitle('Subscription Request Succeeded!')
    .setDescription(
      `HellCom has tested the channel and verified that it works! You'll see a new message in <#${message.channel.id}> with the war status!` +
        '\n\n' +
        `${msgLink} will be updated every 30 minutes with new information automatically. Specifically this is on the hour and on every half hour. eg. 1:00 and 1:30 or 1300 and 1330 (military time).` +
        '\n\n' +
        'If, for some reason, HellCom is unable to update the message (due to Missing Permissions, for example), it will stop trying to update the message. You can always re-enable the subscription using `/subscribe`.'
    )
    .setFooter({text: FOOTER_MESSAGE})
    .setTimestamp();
  embeds.push(embed);
  return {embeds, components: []};
}

export function subStatusRemoveSuccessEmbed(
  {
    guildId,
    channelId,
    messageId,
  }: {
    guildId: string;
    channelId: string;
    messageId: string;
  },
  deleted: boolean
) {
  const embeds = [];
  const msgLink = `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: client.user?.username || 'HellCom',
      iconURL: client.user?.avatarURL() || undefined,
    })
    .setTitle('Subscription Disabled!')
    .setDescription(
      `Disabled war summary status updates in <#${channelId}>!` +
        '\n\n' +
        (deleted
          ? 'HellCom has successfully deleted the war status message.'
          : `HellCom was unable to delete the war status message; If you would like to delete it yourself, you can navigate to it using the link below.
${msgLink}`)
    )
    .setFooter({text: FOOTER_MESSAGE})
    .setTimestamp();

  embeds.push(embed);
  return {embeds, components: []};
}

export function subscribeFailureEmbed(
  type: string,
  interaction: ChannelSelectMenuInteraction,
  error: DiscordAPIError
) {
  // https://github.com/meew0/discord-api-docs-1/blob/master/docs/topics/RESPONSE_CODES.md#json-error-response
  const {code, message} = error;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: interaction.user.tag,
      iconURL: interaction.user.avatarURL() || undefined,
    })
    .setTitle('Subscription Check Failed')
    .setDescription(
      'HellCom failed to enable the subscription for the requested channel. This is likely due to missing permissions.' +
        '\n\n' +
        `HellCom requires the following permissions in <#${interaction.values[0]}>:` +
        '\n' +
        '- `View Channel`\n' +
        '- `Send Messages`\n' +
        '- `Embed Links`\n' +
        '- `Use External Emojis`\n' +
        "__None of these permission allows HellCom to read messages or channel information. It can only access *it's own messages and edit them*__." +
        '\n\n' +
        'Here is the error as received from Discord:' +
        '\n' +
        `\`${code}: ${message}\``
    )
    .addFields({
      name: '\u200b',
      value: 'You may use the below to try again.',
    })
    .setFooter({text: FOOTER_MESSAGE})
    .setColor(EMBED_COLOUR as ColorResolvable)
    .setTimestamp();
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`subscribe-${type}_add`)
      .setLabel('Retry')
      .setStyle(ButtonStyle.Primary)
  );
  return {embeds: [embed], components: [row]};
}

export function subUpdatesAddSuccessEmbed(message: Message<true>) {
  const embeds = [];
  const embed = new EmbedBuilder()
    .setAuthor({
      name: client.user?.username || 'HellCom',
      iconURL: client.user?.avatarURL() || undefined,
    })
    .setTitle('Subscription Request Succeeded!')
    .setDescription(
      `HellCom has tested the channel and verified that it works! You'll see a new message in <#${message.channel.id}> notifying folks about future war update messages!` +
        '\n\n' +
        'If, for some reason, HellCom is unable to send war updates in the channel (due to Missing Permissions, for example), it will automatically disable war updates for the channel. You can always re-enable the subscription using `/subscribe`.'
    )
    .setFooter({text: FOOTER_MESSAGE})
    // .setColor(EMBED_COLOUR as ColorResolvable)
    .setTimestamp();
  embeds.push(embed);
  return {embeds, components: []};
}

export function subUpdatesNotifEmbed() {
  const embed = new EmbedBuilder()
    .setThumbnail(factionSprites['Humans'])
    .setColor(FACTION_COLOUR.Humans)
    .setTitle('War Updates Enabled!')
    .setDescription(
      'This channel has been subscribed to galactic war updates.' +
        '\n\n' +
        'HellCom will send subsequent messages informing Helldivers of war updates as they happen. These war updates include campaign victories and losses, new campaigns, in-game events such as additional stratagems, major orders, and more!' +
        '\n\n' +
        'Godspeed, fellow soldiers.'
    )
    .setFooter({text: SUBSCRIBE_FOOTER})
    .setTimestamp();
  return {embeds: [embed]};
}

export function subNotifRemoveSuccessEmbed({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  guildId,
  channelId,
}: {
  guildId: string;
  channelId: string;
}) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: client.user?.username || 'HellCom',
      iconURL: client.user?.avatarURL() || undefined,
    })
    .setTitle('Subscription Disabled!')
    .setDescription(
      `War update messages will no longer be sent in <#${channelId}>!`
    )
    .setFooter({text: FOOTER_MESSAGE})
    // .setColor(EMBED_COLOUR as ColorResolvable)
    .setTimestamp();

  return {embeds: [embed], components: []};
}
