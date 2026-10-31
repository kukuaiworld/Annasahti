import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeliveryTasksController } from './controllers/delivery-tasks.controller';
import { BatchQrController } from './controllers/batch-qr.controller';
import { SafeChainController } from './controllers/safechain.controller';
import { AdminDeliveryController } from './controllers/admin-delivery.controller';
import { DeliveryTasksService } from './services/delivery-tasks.service';
import { BatchQrService } from './services/batch-qr.service';
import { SafeChainService } from './services/safechain.service';
import { QuantityAccountingService } from './services/quantity-accounting.service';
import { InMemoryDeliveryTaskRepository } from './repositories/in-memory-delivery-task.repository';
import { InMemorySafeChainEventRepository } from './repositories/in-memory-safechain-event.repository';
import {
  DELIVERY_TASK_REPOSITORY,
} from './repositories/delivery-task.repository.interface';
import {
  SAFECHAIN_EVENT_REPOSITORY,
} from './repositories/safechain-event.repository.interface';
import { PlatformReviewerGuard } from '../organisations/guards/platform-reviewer.guard';

@Module({
  imports: [AuthModule],
  controllers: [
    DeliveryTasksController,
    BatchQrController,
    SafeChainController,
    AdminDeliveryController,
  ],
  providers: [
    DeliveryTasksService,
    BatchQrService,
    SafeChainService,
    QuantityAccountingService,
    PlatformReviewerGuard,
    {
      provide: DELIVERY_TASK_REPOSITORY,
      useClass: InMemoryDeliveryTaskRepository,
    },
    {
      provide: SAFECHAIN_EVENT_REPOSITORY,
      useClass: InMemorySafeChainEventRepository,
    },
    InMemoryDeliveryTaskRepository,
    InMemorySafeChainEventRepository,
  ],
  exports: [
    DeliveryTasksService,
    BatchQrService,
    SafeChainService,
    QuantityAccountingService,
    DELIVERY_TASK_REPOSITORY,
    SAFECHAIN_EVENT_REPOSITORY,
  ],
})
export class DeliveryModule {}
