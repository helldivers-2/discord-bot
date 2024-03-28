import {
  ButtonBuilder,
  CommandInteraction,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import campaign from './campaign';
import community from './community';
import discord from './discord';
import dispatches from './dispatches';
import events from './events';
import history from './history';
import map from './map';
import planet from './planet';
import subscribe from './subscribe';
import wiki from './wiki';
import {Category, WikiData} from '../handlers';

const commandList: Command[] = [
  planet,
  events,
  campaign,
  subscribe,
  discord,
  dispatches,
  history,
  community,
  map,
  wiki,
];
const notEphemeral: string[] = [];
const ephemeralCmds = commandList
  .map(x => x.data.name)
  .filter(x => !notEphemeral.includes(x));

const commandHash: Record<
  string,
  (interaction: CommandInteraction) => Promise<void>
> = {};
for (const command of commandList) commandHash[command.data.name] = command.run;

const modalHash: Record<
  string,
  (interaction: ModalSubmitInteraction) => Promise<void>
> = {};

// elevated commands -- not for base users
const ownerCmds: string[] = [];

// cycle through non-admin commands as status
const presenceCmds = Object.keys(commandHash)
  .filter(x => ![...ownerCmds].includes(x))
  .map(x => `/${x}`);

// commands to offer planet autocomplete suggestions for
const planetAutoCmds = ['planet', 'map'];
const campaignAutoCmds = ['campaign'];

// commands to not defer/suggestion etc. instead provide a modal for further input
const modalCmds: string[] = [];

// load the wiki pages
const wikiCmd: {
  buttons: ButtonBuilder[];
  dirSelect: Record<string, StringSelectMenuBuilder>;
  categories: Category[];
  pages: WikiData[];
} = {
  buttons: [],
  dirSelect: {},
  categories: [],
  pages: [],
};

export {
  commandList,
  commandHash,
  modalHash,
  ownerCmds,
  presenceCmds,
  modalCmds,
  ephemeralCmds,
  planetAutoCmds,
  campaignAutoCmds,
  wikiCmd,
};
