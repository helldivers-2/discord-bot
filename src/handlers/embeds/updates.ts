import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import {
  data,
  HelldiversDiscordAnnouncement,
  SteamPost,
} from '../../api-wrapper';
import dayjs from 'dayjs';
import {FOOTER_MESSAGE} from '../../commands/_components';

interface UpdatePageParams {
  interaction: string;
  timestamp: number;
  type: HelldiversDiscordAnnouncement['type'] | 'STEAM' | 'PATCH';
  action: string;
}

export function updateTimestampResponse({
  interaction,
  timestamp,
  type,
  action,
}: UpdatePageParams): {
  embeds: EmbedBuilder[];
  components?: ActionRowBuilder<ButtonBuilder>[];
} {
  if (type === 'STEAM' || type === 'PATCH') {
    const steamPosts = data.SteamPosts.filter(news =>
      type === 'PATCH'
        ? news.title.toLowerCase().includes('patch')
        : !news.title.toLowerCase().includes('patch')
    ).sort((a, b) => b.date.getTime() - a.date.getTime());

    let post: SteamPost | undefined = steamPosts[0];
    if (action === 'back') {
      post = steamPosts.find(d => d.date.getTime() < timestamp);
    } else if (action === 'next') {
      const futurePosts = steamPosts.filter(d => d.date.getTime() > timestamp);
      post = futurePosts.reduce((closestPost, currentPost) => {
        return Math.abs(currentPost.date.getTime() - timestamp) <
          Math.abs(closestPost.date.getTime() - timestamp)
          ? currentPost
          : closestPost;
      }, futurePosts[0]);
    }
    if (!post) return {embeds: [noUpdates], components: []};
    const hasBack = steamPosts.indexOf(post) !== steamPosts.length - 1;
    const hasNext = steamPosts.indexOf(post) !== 0;

    const embed = new EmbedBuilder()
      .setTitle(post.title)
      .setURL(post.url)
      .setTimestamp(dayjs(post.date).valueOf())
      .setFooter({text: FOOTER_MESSAGE});

    if (post.contents.length > 4000)
      embed.setDescription(
        post.contents.slice(0, 4000) +
          '`...`\n\n## Click the button below to read the full post!'
      );
    else embed.setDescription(post.contents);

    const backButton = new ButtonBuilder()
      .setCustomId(`updates-${type}-${post.date.getTime()}-back`)
      .setLabel('Previous Post')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!hasBack);
    const nextButton = new ButtonBuilder()
      .setCustomId(`updates-${type}-${post.date.getTime()}-next`)
      .setLabel('Next Post')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!hasNext);
    const steamButton = new ButtonBuilder()
      .setLabel('Steam Post')
      .setStyle(ButtonStyle.Link)
      .setURL(post.url);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      backButton,
      nextButton,
      steamButton
    );
    return {
      embeds: [embed],
      components: [row],
    };
  } else {
    const announcements = data.HelldiversDiscordAnnouncements.filter(
      d => d.type === type
    )
      .filter(d => d.content !== '[Original Message Deleted]')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    let announcement: HelldiversDiscordAnnouncement | undefined =
      announcements[0];
    if (action === 'back') {
      // find the closest announcement before the timestamp
      announcement = announcements.find(d => d.timestamp.getTime() < timestamp);
    } else if (action === 'next') {
      const futurePosts = announcements.filter(
        d => d.timestamp.getTime() > timestamp
      );
      announcement = futurePosts.reduce((closestPost, currentPost) => {
        return Math.abs(currentPost.timestamp.getTime() - timestamp) <
          Math.abs(closestPost.timestamp.getTime() - timestamp)
          ? currentPost
          : closestPost;
      }, futurePosts[0]);
    }
    if (!announcement || !announcement.content)
      return {
        embeds: [noUpdates],
        components: [],
      };

    const hasBack =
      announcements.indexOf(announcement) !== announcements.length - 1;
    const hasNext = announcements.indexOf(announcement) !== 0;
    const embed = new EmbedBuilder()
      .setDescription(announcement.content)
      .setTimestamp(announcement.timestamp)
      .setFooter({
        text: 'Original message sent by Arrowhead Community Managers',
      });
    const backButton = new ButtonBuilder()
      .setCustomId(`updates-${type}-${announcement.timestamp.getTime()}-back`)
      .setLabel('Previous Post')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!hasBack);
    const nextButton = new ButtonBuilder()
      .setCustomId(`updates-${type}-${announcement.timestamp.getTime()}-next`)
      .setLabel('Next Post')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!hasNext);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      backButton,
      nextButton
    );
    return {
      embeds: [embed],
      components: [row],
    };
  }
}

const noUpdates = new EmbedBuilder()
  .setDescription('No updates found!')
  .setDescription('Please try the command again.')
  .setFooter({text: FOOTER_MESSAGE});
