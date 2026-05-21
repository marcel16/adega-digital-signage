import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;
  private logger: winston.Logger;

  constructor() {
    const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'storage', 'logs');

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
                const ctx = context || 'Application';
                const traceStr = trace ? `\n${trace}` : '';
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}] [${ctx}] ${message}${metaStr}${traceStr}`;
              }),
            ),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 10485760,
          maxFiles: 10,
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: 10485760,
          maxFiles: 10,
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, ...optionalParams: unknown[]) {
    this.logger.info(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  error(message: string, trace?: string, ...optionalParams: unknown[]) {
    this.logger.error(message, { context: this.context, trace, ...this.parseParams(optionalParams) });
  }

  warn(message: string, ...optionalParams: unknown[]) {
    this.logger.warn(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  debug(message: string, ...optionalParams: unknown[]) {
    this.logger.debug(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  verbose(message: string, ...optionalParams: unknown[]) {
    this.logger.verbose(message, { context: this.context, ...this.parseParams(optionalParams) });
  }

  audit(action: string, entity: string, entityId: string, userId: string, metadata?: Record<string, unknown>) {
    this.logger.info('AUDIT', {
      context: this.context,
      audit: true,
      action,
      entity,
      entityId,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  private parseParams(params: unknown[]): Record<string, unknown> {
    if (params.length === 0) return {};
    if (params.length === 1 && typeof params[0] === 'object') {
      return params[0] as Record<string, unknown>;
    }
    return { extra: params };
  }
}
