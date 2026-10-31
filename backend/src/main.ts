import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { resolveCorsOrigins } from './config/cors.config';
import { validateEnvironment } from './config/env-validation';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  validateEnvironment(logger);

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('app.nodeEnv') === 'production';

  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const port = configService.get<number>('app.port', 3000);

  // BUG-11 fix: standard security headers for every response
  app.use(helmet());

  // BUG-11 fix (Phase 0 Task H): strict CORS whitelist with an explicit
  // local-development default (http://localhost:3000 - the Next.js frontend)
  // resolved from ALLOWED_ORIGINS only; wildcard origins are rejected.
  const corsOrigins = resolveCorsOrigins(
    configService.get<string>('app.allowedOrigins') || process.env.ALLOWED_ORIGINS,
    isProduction,
    logger,
  );
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // BUG-12 fix: interactive OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FoodLoop API')
    .setDescription(
      'FoodLoop - food rescue and recovery platform connecting donors, verified recipient organisations, volunteers and authorised waste processors.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'supabase-access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`API documentation available at: /${apiPrefix}/docs`);
}

void bootstrap();
