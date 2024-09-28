import {ActivityType, Client} from 'discord.js';
import {schedule} from 'node-cron';
import {presenceCmds} from '../commands';
import {config, isProd} from '../config';
import {getData, mappedNames} from '../api-wrapper';
import {compareData, dbData, logger, redis, updateMessages} from '../handlers';

const BOT_TOKEN = config.BOT_TOKEN;
const PERSISTENT_MESSAGE_INTERVAL = config.PERSISTENT_MESSAGE_INTERVAL;
const API_UPDATE_INTERVAL = config.API_UPDATE_INTERVAL;
const STATUS_UPDATE_INTERVAL = config.STATUS_UPDATE_INTERVAL;
const DB_DATA_INTERVAL = config.DB_DATA_INTERVAL;
const COMPARE_INTERVAL = config.COMPARE_INTERVAL;
const VERSION = config.VERSION;

// Code executed before the bot client is officially logged in
const startup = async () => {
  // redis.connect();

  // get api data on startup
  const apiStartTime = Date.now();
  getData()
    .then(data => {
      mappedNames.planets = data.Planets.map(x => x.name);
      mappedNames.campaignPlanets = data.Campaigns.map(x => x.planetName);
    })
    .then(() => {
      const time = `${Date.now() - apiStartTime}ms`;
      logger.info(`Loaded ${mappedNames.planets.length} planets in ${time}`, {
        type: 'startup',
      });
    });
};

export {startup};
