import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { IntelligenceController } from './controllers/intelligence.controller';
import { ForpController } from './controllers/forp.controller';
import { DataReadinessService } from './services/data-readiness.service';
import { WastePatternService } from './services/waste-pattern.service';
import { ForpService } from './services/forp.service';
import { SimulationOrchestratorService } from './services/simulation-orchestrator.service';
import { OperationalIntelligenceService } from './services/operational-intelligence.service';
import { InMemoryIntelligenceRepository } from './repositories/in-memory-intelligence.repository';
import { INTELLIGENCE_REPOSITORY } from './repositories/intelligence.repository.interface';
import { InMemoryOrganisationRepository } from '../organisations/repositories/in-memory-organisation.repository';
import { ORGANISATION_REPOSITORY } from '../organisations/repositories/organisation.repository.interface';

@Module({
  imports: [DatabaseModule, AuthModule, OrganisationsModule, DeliveryModule],
  controllers: [IntelligenceController, ForpController],
  providers: [
    DataReadinessService,
    WastePatternService,
    ForpService,
    SimulationOrchestratorService,
    OperationalIntelligenceService,
    {
      provide: INTELLIGENCE_REPOSITORY,
      useClass: InMemoryIntelligenceRepository,
    },
    InMemoryIntelligenceRepository,
    {
      provide: ORGANISATION_REPOSITORY,
      useClass: InMemoryOrganisationRepository,
    },
    InMemoryOrganisationRepository,
  ],
  exports: [
    DataReadinessService,
    WastePatternService,
    ForpService,
    SimulationOrchestratorService,
    OperationalIntelligenceService,
    INTELLIGENCE_REPOSITORY,
  ],
})
export class IntelligenceModule {}
