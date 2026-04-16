/**
 * Sentry client initialisation — stub.
 *
 * @sentry/react is not yet installed. When added, restore the full
 * implementation from git history (commit db81ab6). Until then this
 * no-op prevents build failures.
 *
 * GluMira is an educational platform — `sendDefaultPii` must remain false
 * and the `beforeSend` hook must strip any user object before it ships.
 */
export function initSentryClient(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  if (import.meta.env.DEV) {
    console.warn('[sentry] initSentryClient called but @sentry/react is not installed.');
  }
}
