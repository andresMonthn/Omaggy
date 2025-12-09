import pino from 'pino';

/**
 * @name Logger
 * @description Implementación de logger basada en Pino.
 */
const Logger = pino({
  browser: {
    asObject: true,
  },
  level: 'debug',
  base: {
    env: process.env.NODE_ENV,
  },
  errorKey: 'error',
});

export { Logger };
