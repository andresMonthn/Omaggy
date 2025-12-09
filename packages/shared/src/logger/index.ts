import { createRegistry } from '../registry';
import { Logger as LoggerInstance } from './logger';

// Define the type for the logger provider.  Currently supporting 'pino'.
type LoggerProvider = 'pino' | 'console';

// Use pino as the default logger provider
const LOGGER = (process.env.LOGGER ?? 'pino') as LoggerProvider;

// Create a registry for logger implementations
const loggerRegistry = createRegistry<LoggerInstance, LoggerProvider>();

// Register the 'pino' logger implementation
loggerRegistry.register('pino', async () => {
  const { Logger: PinoLogger } = await import('./impl/pino');

  return PinoLogger;
});

// Register the 'console' logger implementation
loggerRegistry.register('console', async () => {
  const { Logger: ConsoleLogger } = await import('./impl/console');

  return ConsoleLogger;
});

/**
 * @name getLogger
 * @description Obtiene la implementación de logger según `LOGGER` usando el registro.
 */
export async function getLogger() {
  return loggerRegistry.get(LOGGER);
}
