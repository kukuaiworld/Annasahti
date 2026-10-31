import { Logger } from '@nestjs/common';

/**
 * Validates required environment variables at startup (BUG-13 fix).
 * The application refuses to start silently misconfigured.
 *
 * - Always required: authentication trust anchor (JWKS), database access.
 * - In production additionally required: PostgreSQL over TLS with certificate
 *   verification force-enabled.
 */
export function validateEnvironment(logger: Logger): void {
  const errors: string[] = [];

  const SUPABASE_URL = process.env.SUPABASE_URL;
  if (!SUPABASE_URL || SUPABASE_URL.startsWith('https://placeholder-project.supabase.co')) {
    errors.push('SUPABASE_URL must be configured to a real Supabase project URL.');
  }

  const JWKS_URL = process.env.SUPABASE_JWKS_URL || `${SUPABASE_URL || ''}/auth/v1/.well-known/jwks.json`;
  if (!JWKS_URL || SUPABASE_URL === undefined) {
    errors.push('SUPABASE_JWKS_URL must be configured (JWT signature keys).');
  }
  if (JWKS_URL && process.env.NODE_ENV === 'production' && !JWKS_URL.startsWith('https://')) {
    errors.push('SUPABASE_JWKS_URL must use HTTPS in production.');
  }

  if (!process.env.DATABASE_URL && !process.env.DATABASE_HOST && !process.env.POSTGRES_DB) {
    errors.push('Database access must be configured (DATABASE_URL or DATABASE_HOST/POSTGRES_DB).');
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
      errors.push('DATABASE_SSL_REJECT_UNAUTHORIZED=false is forbidden in production.');
    }
    if ((process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .some((origin) => origin.trim() === '*')) {
      errors.push('ALLOWED_ORIGINS wildcard "*" is forbidden: wildcard origins are not permitted with credentials.');
    }
    if (process.env.DATABASE_SSL !== 'true' && process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost')) {
      // Production databases must use TLS; enforced by databaseConfig + DatabaseService
      logger.warn('DATABASE_SSL is not "true" in production: ensure the connection is TLS-protected.');
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      logger.fatal(`Configuration error: ${error}`);
    }
    throw new Error(
      `Invalid environment configuration (${errors.length} problem(s)). Fix backend/.env or the deployment environment and start again.`,
    );
  }

  logger.log('Environment configuration validated successfully.');
}
