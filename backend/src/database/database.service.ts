import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * Transaction-bound query executor. All statements run on the same leased
 * connection, so multi-step writes are atomic and database triggers observe
 * the correct actor through app.user_id.
 */
export interface TransactionRunner {
  query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]>;
  queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null>;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const dbUrl = this.configService.get<string>('database.url');

    const ssl = this.buildSslConfiguration();

    if (dbUrl) {
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl,
      });
    } else {
      this.pool = new Pool({
        host: this.configService.get<string>('database.host'),
        port: this.configService.get<number>('database.port'),
        user: this.configService.get<string>('database.user'),
        password: this.configService.get<string>('database.password'),
        database: this.configService.get<string>('database.database'),
        ssl,
      });
    }

    this.pool.on('error', (err: Error) => {
      this.logger.error('Unexpected error on idle PostgreSQL client', err.stack);
    });
  }

  /**
   * TLS configuration for the PostgreSQL connection.
   * Certificate validation can only be disabled explicitly via
   * DATABASE_SSL_REJECT_UNAUTHORIZED=false, and never in production.
   */
  private buildSslConfiguration(): false | { rejectUnauthorized: boolean } {
    const databaseSsl = this.configService.get<boolean>('database.ssl');
    if (!databaseSsl) {
      return false;
    }

    const rejectUnauthorized = this.configService.get<boolean>('database.sslRejectUnauthorized');

    if (rejectUnauthorized === false) {
      if (this.configService.get<string>('app.nodeEnv') === 'production') {
        throw new Error(
          'TLS VERIFICATION VIOLATION: DATABASE_SSL_REJECT_UNAUTHORIZED=false is not permitted with NODE_ENV=production. Configure a trusted CA for the database connection.',
        );
      }
      this.logger.warn(
        'PostgreSQL TLS certificate verification is DISABLED (DATABASE_SSL_REJECT_UNAUTHORIZED=false). This must never be used in production.',
      );
    }

    return { rejectUnauthorized: rejectUnauthorized !== false };
  }

  async onModuleInit(): Promise<void> {
    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('PostgreSQL database connected successfully');
    } catch (err: any) {
      this.logger.warn(`Initial database connection attempt failed: ${err.message}. Connection pool will retry on request.`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log('PostgreSQL database pool closed');
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const res: QueryResult<T> = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Executed query in ${duration}ms: ${text.slice(0, 80)}...`);
      return res.rows;
    } catch (error: any) {
      this.logger.error(`Query error on "${text.slice(0, 100)}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Executes the callback atomically on a single leased connection.
   *
   * When userId is provided, the database variable app.user_id is set for the
   * transaction so that audit triggers (safechain_events consolidation) can
   * attribute events to the acting user. The value is local to the
   * transaction and cleared on commit/rollback, preventing cross-request
   * leakage through connection reuse.
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    userId?: string,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (userId) {
        await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
      }
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getPool(): Pool {
    return this.pool;
  }
}
