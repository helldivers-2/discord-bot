import {data, seasons} from './api';

export function getUtcTime(helldiversTime: number, war_id?: number) {
  const warId = war_id || seasons.current;
  return helldiversTime * 1000 + data[warId].UTCOffset;
}
