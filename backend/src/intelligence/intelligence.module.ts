import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { IntelligenceController } from './controllers/intelligence.controller';
import { ForpController } from './controllers/forp.controller';
import { DataReadinessService } from './services/data-readiness.service';
import { WastePatternService } from './services/waste-pattern.service';
import { ForpService } from './services/forp.service';
import { SimulationOrchestratorService } from './services/simulation-orchestrator.service';
import { InMemoryIntelligenceRepository } from './repositories/in-memory-intelligence.repository';
import { INTELLIGENCE_REPOSITORY } from './repositories/intelligence.repository.interface';

@Module({
  imports: [AuthModule, OrganisationsModule, DeliveryModule],
  controllers: [IntelligenceController, ForpController],
  providers: [
    DataReadinessService,
    WastePatternService,
    ForpService,
    SimulationOrchestratorService,
    {
      provide: INTELLIGENCE_REPOSITORY,
      useClass: InMemoryIntelligenceRepository,
    },
    InMemoryIntelligenceRepository,
  ],
  exports: [
    DataReadinessService,
    WastePatternService,
    ForpService,
    SimulationOrchestratorService,
    INTELLIGENCE_REPOSITORY,
  ],
})
export class IntelligenceModule {}
