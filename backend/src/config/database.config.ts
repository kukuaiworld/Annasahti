export interface DatabaseConfig {
  url?: string;
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  ssl?: boolean;
}

export const databaseConfig = (): { database: DatabaseConfig } => ({
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || process.env.DATABASE_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.POSTGRES_DB || process.env.DATABASE_NAME || 'postgres',
    ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production',
  },
});
