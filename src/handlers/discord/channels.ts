import {
  TextChannel,
  PublicThreadChannel,
  ChannelType,
  DiscordAPIError,
} from 'discord.js';
import {client} from '../client';
import {logger} from '../logging';

export async function validateChannel(
  id: string
): Promise<TextChannel | PublicThreadChannel | void> {
  try {
    // TODO: fix issue where bot can see channel exists (is in the server), but cannot send messages. discord err 50001 Missing Access
    const channel = await client.channels.fetch(id);
    if (!channel) return;
    if (
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.PublicThread ||
      channel.type === ChannelType.GuildAnnouncement ||
      channel.type === ChannelType.AnnouncementThread
    )
      return channel as TextChannel | PublicThreadChannel;
    return;
  } catch (err) {
    const discordErr = err as DiscordAPIError;
    logger.error(discordErr.message, {type: 'error'});
    return;
  }
}

export async function validateChannelArr(
  ids: string[]
): Promise<(TextChannel | PublicThreadChannel)[]> {
  const channels: (TextChannel | PublicThreadChannel)[] = [];
  for (const id of ids) {
    const channel = await validateChannel(id);
    if (channel) channels.push(channel);
  }
  return channels;
}
