import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const dbUrl = this.configService.get<string>('database.url');

    if (dbUrl) {
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl: this.configService.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
      });
    } else {
      this.pool = new Pool({
        host: this.configService.get<string>('database.host'),
        port: this.configService.get<number>('database.port'),
        user: this.configService.get<string>('database.user'),
        password: this.configService.get<string>('database.password'),
        database: this.configService.get<string>('database.database'),
        ssl: this.configService.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
      });
    }

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle PostgreSQL client', err.stack);
    });
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

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
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
