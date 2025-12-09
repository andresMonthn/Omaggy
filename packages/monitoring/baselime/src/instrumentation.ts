/** Registra la instrumentación Baselime para Next.js cuando está habilitada por env. */
export async function registerInstrumentation() {
  if (process.env.ENABLE_MONITORING_INSTRUMENTATION !== 'true') {
    return;
  }

  const serviceName = process.env.INSTRUMENTATION_SERVICE_NAME;

  if (!serviceName) {
    throw new Error(`
      You have set the Baselime instrumentation provider, but have not set the INSTRUMENTATION_SERVICE_NAME environment variable. 
      Please set the INSTRUMENTATION_SERVICE_NAME environment variable.
    `);
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { BaselimeSDK, BetterHttpInstrumentation, VercelPlugin } =
      await import('@baselime/node-opentelemetry');

    const sdk = new BaselimeSDK({
      serverless: true,
      service: serviceName,
      baselimeKey: process.env.NEXT_PUBLIC_BASELIME_KEY,
      instrumentations: [
        new BetterHttpInstrumentation({
          plugins: [new VercelPlugin()],
        }),
      ],
    });

    sdk.start();
  }
}
