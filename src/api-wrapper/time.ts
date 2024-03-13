import {data} from './api';

export function getUtcTime(helldiversTime: number) {
  return helldiversTime * 1000 + data.UTCOffset;
}
