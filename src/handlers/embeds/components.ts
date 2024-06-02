import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import {config} from '../../config';

const {
  DISCORD_INVITE,
  HD_COMPANION_LINK,
  KOFI_LINK,
  TOP_GG_LINK,
  DISCORD_APPLICATION_DIRECTORY,
  GITHUB_LINK,
} = config;

export const supportDiscordButton = new ButtonBuilder()
  .setLabel('HellCom Discord')
  .setEmoji('<:hellcom:1232123669560430693>')
  .setStyle(ButtonStyle.Link)
  .setURL(DISCORD_INVITE);

export const supportDiscordRow =
  new ActionRowBuilder<ButtonBuilder>().addComponents([supportDiscordButton]);

export const hdCompanionButton = new ButtonBuilder()
  .setLabel('Helldivers Companion')
  .setEmoji('<:helldiverscompanion:1232123938394607656>')
  .setStyle(ButtonStyle.Link)
  .setURL(HD_COMPANION_LINK);

export const kofiButton = new ButtonBuilder()
  .setLabel('Ko-fi')
  .setEmoji('<:kofi:1246609092617961573>')
  .setStyle(ButtonStyle.Link)
  .setURL(KOFI_LINK);

export const summaryRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
  supportDiscordButton,
  hdCompanionButton,
  kofiButton,
]);

export const topGGButton = new ButtonBuilder()
  .setLabel('Top.GG')
  // .setEmoji('<:topgg:1232124484229775360>')
  .setStyle(ButtonStyle.Link)
  .setURL(TOP_GG_LINK);

export const discordAppButton = new ButtonBuilder()
  .setLabel('App Directory')
  .setEmoji('<:discord:1246609603953819648>')
  .setStyle(ButtonStyle.Link)
  .setURL(DISCORD_APPLICATION_DIRECTORY);

export const githubButton = new ButtonBuilder()
  .setLabel('GitHub')
  // .setEmoji('<:github:1246609603953819648>')
  .setStyle(ButtonStyle.Link)
  .setURL(GITHUB_LINK);

export const supportRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
  kofiButton,
  topGGButton,
  githubButton,
]);
