import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { DatabaseModule } from './database/database.module';
import { SafeChainModule } from './safechain/safechain.module';
import { FoodBatchesModule } from './food-batches/food-batches.module';
import { InspectionsModule } from './inspections/inspections.module';
import { MatchingModule } from './matching/matching.module';
import { AllocationsModule } from './allocations/allocations.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env', '.env.example'],
    }),
    DatabaseModule,
    SafeChainModule,
    FoodBatchesModule,
    InspectionsModule,
    MatchingModule,
    AllocationsModule,
    DeliveriesModule,
    HealthModule,
  ],
})
export class AppModule {}
