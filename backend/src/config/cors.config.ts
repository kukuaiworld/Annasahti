import { Logger } from '@nestjs/common';

/**
 * Frontend origins allowed to make credentialed cross-origin API requests.
 *
 * - The ONLY configuration source is the ALLOWED_ORIGINS environment variable
 *   (comma-separated absolute origins).
 * - Wildcard "*" is never permitted: with credentials:true a reflected
 *   wildcard would expose every origin. It is stripped/rejected.
 * - Development default: http://localhost:3000 (the local Next.js frontend),
 *   used ONLY when ALLOWED_ORIGINS is unset outside production.
 * - Production with no configured origins: CORS stays disabled (browser
 *   cross-origin requests are rejected) and the misconfiguration is logged -
 *   it is never silently filled with permissive defaults.
 */
export const DEV_DEFAULT_ORIGINS = ['http://localhost:3000'];

export function parseAllowedOrigins(allowedOrigins: string | undefined): string[] {
  return (allowedOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function resolveCorsOrigins(
  allowedOrigins: string | undefined,
  isProduction: boolean,
  logger?: Logger,
): string[] | false {
  const origins = parseAllowedOrigins(allowedOrigins).filter((origin) => {
    if (origin === '*') {
      if (logger) {
        logger.warn('CORS: wildcard "*" origin ignored - wildcard origins are not permitted with credentials.');
      }
      return false;
    }
    return true;
  });

  if (origins.length > 0) {
    if (isProduction && origins.some((origin) => !origin.startsWith('https://') && !origin.startsWith('http://'))) {
      throw new Error('CORS configuration error: ALLOWED_ORIGINS entries must be absolute origins.');
    }
    return origins;
  }

  if (isProduction) {
    if (logger) {
      logger.warn(
        'CORS: no ALLOWED_ORIGINS configured for production - cross-origin browser requests are disabled.',
      );
    }
    return false;
  }

  return DEV_DEFAULT_ORIGINS;
}
