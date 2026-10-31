export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  allowedOrigins: string;
}

export const appConfig = (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    allowedOrigins: process.env.ALLOWED_ORIGINS || '',
  },
});
