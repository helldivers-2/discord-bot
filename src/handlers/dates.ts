import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';

// adding plugin funcs to dayjs
dayjs.extend(utc);
dayjs.extend(updateLocale);
dayjs.extend(customParseFormat);

// modifying dayjs to use monday as startof the week
dayjs.updateLocale('en', {
  weekStart: 1,
});

/**
 * Returns the start of the week in DD/MM/YYYY format
 * @returns string
 */
export function currentWeek() {
  return dayjs().utc().startOf('week').format('DD/MM/YYYY');
}

export {dayjs};
