import {ChannelType, Client, Message, PartialMessage} from 'discord.js';
import {logger} from '../../handlers';
import {config} from '../../config';
import {db, upsertHD2DiscordAnn} from '../../db';

const BOT_OWNER = config.BOT_OWNER;
const CM_DISPATCHES_CHANNEL = config.CM_DISPATCHES_CHANNEL;
const HD2_ANNOUNCEMENTS_CHANNEL = config.HD2_ANNOUNCEMENTS_CHANNEL;
const AHG_ANNOUNCEMENTS_CHANNEL = config.AHG_ANNOUNCEMENTS_CHANNEL;
const CHANNELS = [
  CM_DISPATCHES_CHANNEL,
  HD2_ANNOUNCEMENTS_CHANNEL,
  AHG_ANNOUNCEMENTS_CHANNEL,
];

export async function startupFetchMessages(client: Client) {
  logger.info(`Fetching messages in ${CHANNELS.length} channels`, {
    type: 'support-startup',
  });
  const channels = [];
  for (const c of CHANNELS) channels.push(await client.channels.fetch(c));
  const dbMessages = await db.query.helldiversDiscordAnns.findMany();
  for (const channel of channels) {
    if (
      channel &&
      (channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.PublicThread ||
        channel.type === ChannelType.GuildAnnouncement ||
        channel.type === ChannelType.AnnouncementThread)
    ) {
      const messages = await channel.messages.fetch();
      for (const msg of messages.values()) {
        // Fetch the full message if it's a partial (likely from before bot startup)
        if (msg.partial) await msg.fetch();
        // Skip messages from owner (likely channel setup)
        if (msg.author && msg.author.id === BOT_OWNER) continue;
        if (!msg.content) console.log(msg);
        // Attempt to find the current message in the database
        const dbMsg = dbMessages.find(m => m.messageId === msg.id);
        const matchingContents = dbMessages.find(
          m => m.content === msg.content
        );
        if (dbMsg)
          if (dbMsg.content === msg.content) continue;
          else {
            // Update the message in the database if the content has changed
            await upsertHD2DiscordAnn({
              messageId: msg.id,
              channelName: channel.name,
              channelId: channel.id,
              timestamp: new Date(msg.createdTimestamp),
              editedTimestamp: msg.editedTimestamp
                ? new Date(msg.editedTimestamp)
                : undefined,
              content: msg.content,
              attachmentUrls: msg.attachments.map(a => a.url),
              createdAt: new Date(),
            });
            logger.info(
              `HD2 Discord Announcement content changed in #${channel.name}`,
              {
                type: 'support-message',
                messageId: msg.id,
                channel: channel.name,
                guild: channel.guild.name,
                channelId: channel.id,
                guildId: channel.guildId,
              }
            );
          }
        else {
          if (matchingContents) continue;
          // Create new message in the database if it doesn't exist
          // Using upsert for simplicity as it alr exists, but this is always an insert
          await upsertHD2DiscordAnn({
            messageId: msg.id,
            channelName: channel.name,
            channelId: channel.id,
            timestamp: new Date(msg.createdTimestamp),
            editedTimestamp: msg.editedTimestamp
              ? new Date(msg.editedTimestamp)
              : undefined,
            content: msg.content,
            attachmentUrls: msg.attachments.map(a => a.url),
            createdAt: new Date(),
          });
          logger.info(`New HD2 Discord Announcement in #${channel.name}`, {
            type: 'support-message',
            messageId: msg.id,
            channel: channel.name,
            guild: channel.guild.name,
            channelId: channel.id,
            guildId: channel.guildId,
          });
        }
      }
      // Log the number of messages fetched upon completion
      logger.info(`Fetched ${messages.size} messages in #${channel.name}`, {
        type: 'support-message',
        channel: channel.name,
        guild: channel.guild.name,
        channelId: channel.id,
        guildId: channel.guildId,
      });
    }
  }
}

const messageCreate = async (msg: Message) => {
  if (!CHANNELS.includes(msg.channelId)) return;
  if (msg.partial) msg = await msg.fetch();
  const {channel, guild} = msg;
  // Ensure channel and guild are valid
  if (!('name' in channel))
    throw Error(`Name not found for channel ID ${channel.id}`);
  if (!guild) throw Error(`Guild not found for message ID ${msg.id}`);
  // Create new message in the database if it doesn't exist
  // Using upsert for simplicity as it alr exists, but this is always an insert
  await upsertHD2DiscordAnn({
    messageId: msg.id,
    channelName: channel.name,
    channelId: channel.id,
    timestamp: new Date(msg.createdTimestamp),
    editedTimestamp: msg.editedTimestamp
      ? new Date(msg.editedTimestamp)
      : undefined,
    content: msg.content,
    attachmentUrls: msg.attachments.map(a => a.url),
    createdAt: new Date(),
  });
  logger.info(`New HD2 Discord Announcement in ${channel.name}`, {
    type: 'support-message',
    messageId: msg.id,
    channel: channel.name,
    guild: guild.name,
    channelId: channel.id,
    guildId: msg.guildId,
  });
};

// NOTE: don't need to check for message deletions in these channels as Discord edits them instead
// Deleted messages have the following content: "[Original Message Deleted]"
const messageDelete = async (msg: Message<boolean> | PartialMessage) => {
  if (!CHANNELS.includes(msg.channelId)) return;
  if (msg.partial) msg = await msg.fetch();
  logger.info(
    `Message Deleted: ${msg.guild?.name} ${msg.author?.tag} ${msg.content}`,
    {
      type: 'support-message',
      event: 'messageDelete',
    }
  );
};

const messageUpdate = async (
  oldMsg: Message<boolean> | PartialMessage,
  newMsg: Message<boolean> | PartialMessage
) => {
  if (!CHANNELS.includes(oldMsg.channelId)) return;
  if (oldMsg.partial) oldMsg = await oldMsg.fetch();
  if (newMsg.partial) newMsg = await newMsg.fetch();
  const {channel, guild} = oldMsg;
  // Ensure channel and guild are valid
  if (!('name' in channel))
    throw Error(`Name not found for channel ID ${channel.id}`);
  if (!guild) throw Error(`Guild not found for message ID ${oldMsg.id}`);
  // Update the message in the database if the content has changed
  await upsertHD2DiscordAnn({
    messageId: newMsg.id,
    channelName: channel.name,
    channelId: channel.id,
    timestamp: new Date(newMsg.createdTimestamp),
    editedTimestamp: newMsg.editedTimestamp
      ? new Date(newMsg.editedTimestamp)
      : undefined,
    content: newMsg.content,
    attachmentUrls: newMsg.attachments.map(a => a.url),
    createdAt: new Date(),
  });
  logger.info(`HD2 Discord Announcement content changed in #${channel.name}`, {
    type: 'support-message',
    messageId: oldMsg.id,
    channel: channel.name,
    guild: channel.guild.name,
    channelId: channel.id,
    guildId: channel.guildId,
  });
};

export {messageCreate, messageDelete, messageUpdate};
