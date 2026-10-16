import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { captureError } from './telemetry';

/**
 * Logger service that respects environment configuration.
 * Logs are only output in development mode to avoid performance overhead
 * and exposure of internal logic in production.
 */
@Injectable({
  providedIn: 'root',
})
export class Logger {
  private isDevelopment = !environment.production;

  /**
   * Log informational messages (development only)
   */
  log(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning messages (development only)
   */
  warn(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error messages (always logged, even in production) as one structured record, and
   * forward to Sentry when a DSN is configured (no-op otherwise).
   */
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);
    captureError(error, message);
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}
