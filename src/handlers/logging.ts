import newrelicFormatter from '@newrelic/winston-enricher';
import newrelic from 'newrelic';
import winston from 'winston';
import {syslog} from 'winston/lib/winston/config';
import {config} from '../config';
const {combine, timestamp, printf} = winston.format;

const formatter = printf(({message}) => message);

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels: syslog.levels,
  format: combine(
    newrelicFormatter(winston)(),
    timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
    formatter
  ),
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
  transports: [new winston.transports.Console()],
});

export {newrelic, logger};
