import {ColorResolvable} from 'discord.js';
import {config} from '../config';

export const FOOTER_MESSAGE = config.FOOTER_MESSAGE as string;
export const EMBED_COLOUR = config.EMBED_COLOUR as ColorResolvable;
export const FACTION_COLOUR: {
  [key: string]: ColorResolvable;
} = {
  Humans: 'Aqua',
  Terminids: 'Orange',
  Automaton: 'Red',
};
