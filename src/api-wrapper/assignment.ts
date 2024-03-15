import {data} from './api';

export function getLatestAssignment() {
  return data.Assignment[0];
}
