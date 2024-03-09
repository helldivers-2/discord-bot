import {CommandInteraction, EmbedBuilder, ColorResolvable} from 'discord.js';
import {FOOTER_MESSAGE, EMBED_COLOUR} from '../commands/_components';

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
