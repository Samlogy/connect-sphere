// src/config/logConfig.ts
import path from 'path';

const ENV = process.env.NODE_ENV || 'dev';

export const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
export const LOG_LEVEL = process.env.LOG_LEVEL || (ENV === 'prod' ? 'info' : 'debug');
export const LOG_TO_STDOUT = (process.env.LOG_TO_STDOUT ?? 'true') === 'true'; // recommended true in containers
export const LOG_RETENTION = process.env.LOG_RETENTION || '30d';
export const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '100m';
export const REDACT_FIELDS = (process.env.REDACT_FIELDS || 'password,authorization,token').split(',').map(s => s.trim().toLowerCase());
export const ENABLE_FILE_LOGS = (process.env.ENABLE_FILE_LOGS ?? 'false') === 'true'; // optional: filesystem logging


// src/utils/redact.ts
export function redact(obj: any, sensitiveFields: string[] = []) {
  if (obj == null) return obj;
  const seen = new WeakSet();

  function _redact(value: any): any {
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    if (Array.isArray(value)) return value.map(_redact);

    const out: any = {};
    for (const key of Object.keys(value)) {
      try {
        const low = key.toLowerCase();
        if (sensitiveFields.includes(low)) {
          out[key] = '[REDACTED]';
        } else {
          out[key] = _redact(value[key]);
        }
      } catch {
        out[key] = '[UNSERIALIZABLE]';
      }
    }
    return out;
  }

  return _redact(obj);
}


// src/utils/logger.ts
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
// import { redact } from './redact';

const { combine, timestamp, errors, json, printf, splat } = format;

// json format with timestamp and errors.stack
const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  format((info) => {
    // Ensure message is string
    if (typeof info.message !== 'string' && info.message != null) {
      info.message = JSON.stringify(info.message);
    }
    return info;
  })(),
  json()
);

// human readable format for dev console
const devFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const base = `${timestamp} ${level.toUpperCase()}: ${message}`;
    const extra = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return stack ? `${base}\n${stack}${extra}` : `${base}${extra}`;
  })
);

const transportsList: any[] = [];

// Console (stdout) - recommended for containers (collected by Docker / Fluent Bit / Filebeat)
if (LOG_TO_STDOUT) {
  transportsList.push(new transports.Console({
    level: LOG_LEVEL,
    format: process.env.NODE_ENV === 'prod' ? jsonFormat : devFormat,
    stderrLevels: ['error', 'warn']
  }));
}

// Optional file rotation (useful for single-instance or local dev)
if (ENABLE_FILE_LOGS) {
  transportsList.push(new DailyRotateFile({
    filename: `${LOG_DIR}/%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_RETENTION,
    level: LOG_LEVEL,
    format: jsonFormat,
    handleExceptions: true,
    handleRejections: true
  }));
}

const baseLogger: Logger = createLogger({
  level: LOG_LEVEL,
  levels: undefined,
  format: jsonFormat,
  transports: transportsList,
  exitOnError: false
});

// helper that always redacts sensitive fields before logging
function safeLog(level: string, message: any, meta?: any) {
  const redactedMeta = redact(meta, (process.env.REDACT_FIELDS || 'password,authorization,token').split(',').map(s => s.trim().toLowerCase()));
  baseLogger.log(level, message, redactedMeta);
}

export default {
  logger: baseLogger,
  info: (msg: any, meta?: any) => safeLog('info', msg, meta),
  warn: (msg: any, meta?: any) => safeLog('warn', msg, meta),
  error: (msg: any, meta?: any) => safeLog('error', msg, meta),
  debug: (msg: any, meta?: any) => safeLog('debug', msg, meta),
  child: (meta: any) => baseLogger.child(meta)
};
