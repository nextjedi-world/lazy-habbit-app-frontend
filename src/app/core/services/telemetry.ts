import { environment } from '../../../environments/environment';

/**
 * Sentry wiring. Everything here is a no-op while `environment.sentryDsn` is empty or missing,
 * and `@sentry/angular` is only downloaded (lazy chunk) when a DSN is configured.
 * `sentryDsn` is read defensively because local environment.ts files predate the field.
 */
interface SentryEnv {
  sentryDsn?: string;
  production: boolean;
}
const env = environment as SentryEnv;

type SentryModule = typeof import('@sentry/angular');
let sentry: Promise<SentryModule> | null = null;

export function isSentryEnabled(): boolean {
  return !!env.sentryDsn;
}

export function initSentry(): void {
  if (!isSentryEnabled() || sentry) return;
  sentry = import('@sentry/angular').then((mod) => {
    mod.init({
      dsn: env.sentryDsn,
      environment: env.production ? 'prod' : 'dev',
      release: (globalThis as { __APP_RELEASE__?: string }).__APP_RELEASE__,
      tracesSampleRate: 0,
    });
    return mod;
  });
}

/** Sends an error to Sentry when enabled; never throws. */
export function captureError(error: unknown, message?: string): void {
  if (!sentry) return;
  void sentry
    .then((mod) =>
      mod.captureException(error instanceof Error ? error : new Error(message ?? String(error)), {
        extra: message ? { message } : undefined,
      }),
    )
    .catch(() => undefined);
}
