import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

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
   * Log error messages (always logged, even in production)
   * Use this for critical errors that should be captured
   */
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);

    // TODO: In future, send to error tracking service (Sentry, etc.)
    // if (environment.production) {
    //   this.errorTrackingService.captureError(message, error);
    // }
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
