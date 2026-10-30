import { Module } from '@nestjs/common';
import { AllocationsController } from './allocations.controller';
import { AllocationsService } from './allocations.service';
import { SafeChainModule } from '../safechain/safechain.module';

@Module({
  imports: [SafeChainModule],
  controllers: [AllocationsController],
  providers: [AllocationsService],
  exports: [AllocationsService],
})
export class AllocationsModule {}
