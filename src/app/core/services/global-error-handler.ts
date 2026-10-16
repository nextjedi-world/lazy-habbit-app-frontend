import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Logger } from './logger';

/** Routes uncaught Angular errors through Logger (console + Sentry when enabled). */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(Logger);

  handleError(error: unknown): void {
    this.logger.error('Unhandled error', error);
  }
}
