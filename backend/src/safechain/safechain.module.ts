import { Module } from '@nestjs/common';
import { SafeChainService } from './safechain.service';

@Module({
  providers: [SafeChainService],
  exports: [SafeChainService],
})
export class SafeChainModule {}
