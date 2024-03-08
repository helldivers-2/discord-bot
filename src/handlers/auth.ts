import {config} from '../config';

const {BOT_OWNER} = config;

export async function checkPerms(userId: string) {
  const owners = [BOT_OWNER];

  const permsObj = {
    owner: [...owners].includes(userId),
  };
  return permsObj;
}
