import subscribe from './subscribe';
import updates from './updates';
import warbond from './warbond';
import {ButtonInteraction} from 'discord.js';

const buttonHash: Record<
  string,
  (interaction: ButtonInteraction) => Promise<void>
> = {
  subscribe,
  updates,
  warbond,
};

export {buttonHash};
