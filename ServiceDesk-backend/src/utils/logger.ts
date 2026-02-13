import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import env from '../config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: env.LOG_LEVEL,
  }),
];

// File transports only in production
if (env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: `${env.LOG_FILE_PATH}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );

  // Combined logs
  transports.push(
    new DailyRotateFile({
      filename: `${env.LOG_FILE_PATH}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false,
});

export default logger;
