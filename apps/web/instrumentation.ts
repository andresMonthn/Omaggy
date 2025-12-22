/**
 * This file is used to register monitoring instrumentation
 * for your Next.js application.
 */
import { type Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NODE_ENV !== 'production') {
      process.setMaxListeners(30);
    }
    const { registerMonitoringInstrumentation } = await import(
      '@kit/monitoring/instrumentation'
    );
    await registerMonitoringInstrumentation();
  }
}

/**
 * @name onRequestError
 * @description This function is called when an error occurs during the request lifecycle.
 * It is used to capture the error and send it to the monitoring service.
 * @param err
 */
export const onRequestError: Instrumentation.onRequestError = async (err) => {
  const { getServerMonitoringService } = await import('@kit/monitoring/server');

  const service = await getServerMonitoringService();

  await service.ready();
  await service.captureException(err as Error);
};
