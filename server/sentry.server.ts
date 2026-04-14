import * as Sentry from '@sentry/node';

/**
 * Sentry server initialisation for the Express backend.
 *
 * Inert when `SENTRY_DSN` is not set. Call from `server/index.ts` BEFORE
 * creating the Express app so Sentry's automatic instrumentation hooks
 * into Express middleware correctly.
 *
 * GluMira is an educational platform — `sendDefaultPii` is forced to false.
 */
export function initSentryServer(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[sentry] SENTRY_DSN not set — server telemetry disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}
