import {TextChannel, PublicThreadChannel, ChannelType} from 'discord.js';
import {client} from '../client';

export async function validateChannel(
  id: string
): Promise<TextChannel | PublicThreadChannel | void> {
  const channel = await client.channels.fetch(id);
  if (!channel) return;
  if (
    channel.type === ChannelType.GuildText ||
    channel.type === ChannelType.PublicThread
  )
    return channel as TextChannel | PublicThreadChannel;
  return;
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
