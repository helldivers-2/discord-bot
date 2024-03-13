import {CommandInteraction, EmbedBuilder, ColorResolvable} from 'discord.js';
import {FOOTER_MESSAGE, EMBED_COLOUR} from '../commands/_components';

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function planetNameTransform(planetName: string) {
  return planetName
    .toLowerCase() // Convert to lowercase
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\s/g, '_'); // Replace spaces with underscores
}
