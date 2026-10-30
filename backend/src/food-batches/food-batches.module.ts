import { Module } from '@nestjs/common';
import { FoodBatchesController } from './food-batches.controller';
import { FoodBatchesService } from './food-batches.service';
import { SafeChainModule } from '../safechain/safechain.module';

@Module({
  imports: [SafeChainModule],
  controllers: [FoodBatchesController],
  providers: [FoodBatchesService],
  exports: [FoodBatchesService],
})
export class FoodBatchesModule {}
