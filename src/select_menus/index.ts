import subscribeChannel from './channel/subscribe';
import {
  StringSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  UserSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  RoleSelectMenuInteraction,
} from 'discord.js';

const stringMenuHash: Record<
  string,
  (interaction: StringSelectMenuInteraction) => Promise<void>
> = {
  // custom_id,
};
const channelMenuHash: Record<
  string,
  (interaction: ChannelSelectMenuInteraction) => Promise<void>
> = {
  subscribe: subscribeChannel,
};
const userMenuHash: Record<
  string,
  (interaction: UserSelectMenuInteraction) => Promise<void>
> = {
  // custom_id,
};
const mentionMenuHash: Record<
  string,
  (interaction: MentionableSelectMenuInteraction) => Promise<void>
> = {
  // custom_id,
};
const roleMenuHash: Record<
  string,
  (interaction: RoleSelectMenuInteraction) => Promise<void>
> = {
  // custom_id,
};

export {
  stringMenuHash,
  channelMenuHash,
  userMenuHash,
  mentionMenuHash,
  roleMenuHash,
};
