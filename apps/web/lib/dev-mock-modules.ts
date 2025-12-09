/** Mocks de desarrollo. Función: Provee módulos/funciones no-op para acelerar desarrollo cuando ciertas integraciones no están habilitadas. */

const noop = (name: string) => {
  return () => {
    console.debug(
      `The function "${name}" is mocked for development because your environment variables indicate that it is not needed. 
    If you think this is a mistake, please open a support ticket.`,
    );
  };
};

// Turnstile
export const Turnstile = undefined;
export const TurnstileProps = {};

// Baselime
export const useBaselimeRum = noop('useBaselimeRum');
export const BaselimeRum = undefined;

// Sentry
export const captureException = noop('Sentry.captureException');
export const captureEvent = noop('Sentry.captureEvent');
export const init = noop('Sentry.init');
export const setUser = noop('Sentry.setUser');

// Stripe
export const loadStripe = noop('Stripe.loadStripe');

// Nodemailer
export const createTransport = noop('Nodemailer.createTransport');
