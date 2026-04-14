import * as Sentry from '@sentry/react';

/**
 * Sentry client initialisation for the React app.
 *
 * Inert when `VITE_SENTRY_DSN` is not set, so local dev and CI runs without
 * a DSN are noise-free. Call once from `main.tsx` BEFORE mounting React.
 *
 * GluMira is an educational platform — `sendDefaultPii` is forced to false
 * and the `beforeSend` hook strips identifying fields from the user object.
 * Never let real patient data reach Sentry.
 */
export function initSentryClient(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('[sentry] VITE_SENTRY_DSN not set — client telemetry disabled');
    }
    return;
  }

  Sentry.init({
    beforeSend(event) {
      // Strip any user object that might leak identifying info.
      if (event.user) {
        event.user = { id: event.user.id ?? 'anonymous' };
      }
      return event;
    },
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}
