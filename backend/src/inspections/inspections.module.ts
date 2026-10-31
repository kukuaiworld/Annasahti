import { Module } from '@nestjs/common';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { SafeChainModule } from '../safechain/safechain.module';
import { FoodBatchesModule } from '../food-batches/food-batches.module';

@Module({
  imports: [SafeChainModule, FoodBatchesModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
