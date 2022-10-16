import crypto from 'crypto';
import ColoredLogger from 'node-color-log';

class Logger {
  constructor() {
    this.uuid = crypto.randomUUID();
  }

  info(...args) {
    this.logger.log(...args);
  }

  error(...args) {
    this.logger.color('red').log(...args);
  }

  get logger() {
    const timestamp = (new Date()).toISOString();

    return ColoredLogger.log(`${timestamp} `).joint().log(`[${this.uuid}] `).joint();
  }
}

export default Logger;
