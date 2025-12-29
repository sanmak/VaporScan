/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (!this.isDevelopment && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        // eslint-disable-next-line no-console
        console.info(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(formattedMessage, ...args);
        break;
    }
  }

  public info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  public warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  public error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args);
  }

  public debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args);
  }
}

export const logger = Logger.getInstance();
