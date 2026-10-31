import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { authConfig } from './config/auth.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { SafeChainModule } from './safechain/safechain.module';
import { FoodBatchesModule } from './food-batches/food-batches.module';
import { InspectionsModule } from './inspections/inspections.module';
import { MatchingModule } from './matching/matching.module';
import { AllocationsModule } from './allocations/allocations.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { ImpactModule } from './impact/impact.module';
import { RecognitionModule } from './recognition/recognition.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      envFilePath: ['.env', '.env.example'],
    }),
    // BUG-11 fix: default rate limiting against brute force / DoS on every endpoint
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 120 },
    ]),
    DatabaseModule,
    AuthModule,
    MeModule,
    OrganisationsModule,
    SafeChainModule,
    FoodBatchesModule,
    InspectionsModule,
    MatchingModule,
    AllocationsModule,
    DeliveriesModule,
    ImpactModule,
    RecognitionModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
