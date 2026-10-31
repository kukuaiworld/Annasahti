import { Inject, Injectable } from '@nestjs/common';
import {
  DELIVERY_TASK_REPOSITORY,
  IDeliveryTaskRepository,
} from '../../delivery/repositories/delivery-task.repository.interface';
import {
  IOrganisationRepository,
  ORGANISATION_REPOSITORY,
} from '../../organisations/repositories/organisation.repository.interface';
import {
  ISafeChainEventRepository,
  SAFECHAIN_EVENT_REPOSITORY,
} from '../../delivery/repositories/safechain-event.repository.interface';
import {
  CapabilityReadinessAudit,
  DataFieldAnomaly,
  OperationalDatasetAudit,
  SystemDataQualityReport,
} from '../interfaces/data-quality-report.interface';
import { DataQualityGrade, ReadinessLevel } from '../enums/readiness-level.enum';

@Injectable()
export class DataReadinessService {
  constructor(
    @Inject(DELIVERY_TASK_REPOSITORY)
    private readonly taskRepo: IDeliveryTaskRepository,
    @Inject(ORGANISATION_REPOSITORY)
    private readonly orgRepo: IOrganisationRepository,
    @Inject(SAFECHAIN_EVENT_REPOSITORY)
    private readonly eventRepo: ISafeChainEventRepository,
  ) {}

  async generateQualityReport(): Promise<SystemDataQualityReport> {
    const tasks = await this.taskRepo.findAvailableTasks();
    // Audit datasets
    const taskAudit = this.auditDeliveryTasks(tasks);
    const orgAudit = await this.auditOrganisations();

    const datasets: OperationalDatasetAudit[] = [taskAudit, orgAudit];

    // Compute aggregate quality score
    const avgCompleteness =
      datasets.reduce((acc, d) => acc + d.completenessPercentage, 0) /
      datasets.length;
    const overallScore = Math.round(avgCompleteness);

    let overallGrade = DataQualityGrade.ACCEPTABLE;
    if (overallScore < 50) overallGrade = DataQualityGrade.CRITICAL;
    else if (overallScore < 75) overallGrade = DataQualityGrade.POOR;
    else if (overallScore >= 90) overallGrade = DataQualityGrade.EXCELLENT;

    // Assess readiness of all 6 Advanced Intelligence capabilities
    const capabilities: CapabilityReadinessAudit[] = [
      this.assessWastePatternReadiness(taskAudit.totalRecords),
      this.assessDigitalTwinReadiness(orgAudit.completenessPercentage),
      this.assessEmergencyResilienceReadiness(orgAudit.totalRecords),
      this.assessCounterfactualReadiness(taskAudit.totalRecords),
      this.assessForpReadiness(),
      this.assessNetworkOptimisationReadiness(orgAudit.completenessPercentage),
    ];

    const recommendations = [
      'Require mandatory GPS coordinates for all donor and recipient facilities to support Digital Twin and routing.',
      'Enforce complete delivery confirmation receipts to feed counterfactual baseline models.',
      'Maintain explicit quantity units (kg vs portions) across all donor batches and recipient quotas.',
      'Separate simulation runs and synthetic testbeds from live operational SafeChain ledgers.',
      'Require authorized human reviewer approval for all emergency reroute recommendations.',
    ];

    return {
      generatedAt: new Date(),
      overallScore,
      overallGrade,
      datasets,
      capabilities,
      recommendations,
    };
  }

  private auditDeliveryTasks(tasks: any[]): OperationalDatasetAudit {
    const totalRecords = tasks.length;
    let completeRecords = 0;
    const anomalies: DataFieldAnomaly[] = [];

    let missingUnits = 0;
    let invalidQuantities = 0;

    for (const t of tasks) {
      let isComplete = true;
      if (!t.quantityUnit || t.quantityUnit.trim() === '') {
        missingUnits++;
        isComplete = false;
      }
      if (!t.allocatedQuantity || t.allocatedQuantity <= 0) {
        invalidQuantities++;
        isComplete = false;
      }
      if (isComplete) completeRecords++;
    }

    if (missingUnits > 0) {
      anomalies.push({
        field: 'quantityUnit',
        missingCount: missingUnits,
        invalidCount: 0,
        anomalyRate: totalRecords > 0 ? missingUnits / totalRecords : 0,
        description: 'Records missing explicit measurement units',
      });
    }

    const completenessPercentage =
      totalRecords > 0 ? Math.round((completeRecords / totalRecords) * 100) : 100;

    return {
      datasetName: 'delivery_tasks_and_confirmations',
      totalRecords,
      completeRecords,
      completenessPercentage,
      qualityGrade: completenessPercentage > 85 ? DataQualityGrade.ACCEPTABLE : DataQualityGrade.POOR,
      anomalies,
    };
  }

  private async auditOrganisations(): Promise<OperationalDatasetAudit> {
    const orgs = await this.orgRepo.findPendingVerification();
    const totalRecords = orgs.length;
    let completeRecords = 0;
    let missingCoords = 0;

    for (const o of orgs) {
      if (!o.location || o.location.latitude === undefined || o.location.longitude === undefined) {
        missingCoords++;
      } else {
        completeRecords++;
      }
    }

    const anomalies: DataFieldAnomaly[] = [];
    if (missingCoords > 0) {
      anomalies.push({
        field: 'location.coordinates',
        missingCount: missingCoords,
        invalidCount: 0,
        anomalyRate: totalRecords > 0 ? missingCoords / totalRecords : 0,
        description: 'Organisations missing latitude and longitude coordinates',
      });
    }

    const completenessPercentage =
      totalRecords > 0 ? Math.round((completeRecords / totalRecords) * 100) : 100;

    return {
      datasetName: 'organisations_and_locations',
      totalRecords,
      completeRecords,
      completenessPercentage,
      qualityGrade: completenessPercentage >= 80 ? DataQualityGrade.ACCEPTABLE : DataQualityGrade.POOR,
      anomalies,
    };
  }

  private assessWastePatternReadiness(observations: number): CapabilityReadinessAudit {
    const required = 100;
    const score = Math.min(100, Math.round((observations / required) * 100));
    return {
      capabilityName: 'Feature 1: Waste Pattern Detective',
      readinessLevel:
        observations >= required
          ? ReadinessLevel.PILOT_READY
          : observations >= 10
          ? ReadinessLevel.PROTOTYPE_ONLY
          : ReadinessLevel.NOT_READY,
      requiredObservations: required,
      currentObservations: observations,
      dataReadinessScore: score,
      blockers:
        observations < required
          ? [`Requires at least ${required} donation cycles for seasonal & time-series decomposition. Current: ${observations}`]
          : [],
      assumptions: ['Weekly donation patterns repeat cyclically under normal business operations'],
      evaluationMethodology: 'Mean Absolute Percentage Error (MAPE) against subsequent donor surplus',
    };
  }

  private assessDigitalTwinReadiness(geoCompleteness: number): CapabilityReadinessAudit {
    const isReady = geoCompleteness >= 90;
    return {
      capabilityName: 'Feature 2: Digital Twin Simulation',
      readinessLevel: isReady ? ReadinessLevel.PILOT_READY : ReadinessLevel.PROTOTYPE_ONLY,
      requiredObservations: 50,
      currentObservations: Math.round(geoCompleteness),
      dataReadinessScore: Math.round(geoCompleteness),
      blockers:
        geoCompleteness < 90
          ? ['Requires high-fidelity geographical coordinates and operational transit speed baselines.']
          : [],
      assumptions: ['Synthetic scenarios and operational testbeds are isolated from real impact ledgers'],
      evaluationMethodology: 'Discrete-event step simulation fidelity compared to actual delivery completion logs',
    };
  }

  private assessEmergencyResilienceReadiness(orgCount: number): CapabilityReadinessAudit {
    return {
      capabilityName: 'Feature 3: Emergency Resilience',
      readinessLevel: ReadinessLevel.PILOT_READY,
      requiredObservations: 5,
      currentObservations: orgCount,
      dataReadinessScore: 85,
      blockers: [],
      assumptions: [
        'All emergency reroutes require mandatory human reviewer approval prior to execution.',
        'Potentially compromised food must never be automatically redirected.',
      ],
      evaluationMethodology: 'Feasibility analysis of alternative destination capacity and species constraints',
    };
  }

  private assessCounterfactualReadiness(taskCount: number): CapabilityReadinessAudit {
    return {
      capabilityName: 'Feature 4: Counterfactual Impact',
      readinessLevel: taskCount >= 50 ? ReadinessLevel.PILOT_READY : ReadinessLevel.PROTOTYPE_ONLY,
      requiredObservations: 50,
      currentObservations: taskCount,
      dataReadinessScore: Math.min(100, Math.round((taskCount / 50) * 100)),
      blockers:
        taskCount < 50
          ? ['Empirical non-intervention disposal baseline requires matched donor control data']
          : [],
      assumptions: [
        'Not all rescued food would otherwise have been discarded (35% default counterfactual diversion assumption)',
        'Standard emission factors apply uniformly across categories unless lab-verified',
      ],
      evaluationMethodology: 'Difference-in-differences against non-participating donor baseline surveys',
    };
  }

  private assessForpReadiness(): CapabilityReadinessAudit {
    return {
      capabilityName: 'Feature 5: Open Rescue Protocol (FORP)',
      readinessLevel: ReadinessLevel.PILOT_READY,
      requiredObservations: 1,
      currentObservations: 1,
      dataReadinessScore: 100,
      blockers: [],
      assumptions: ['External partner systems conform to versioned JSON schema contracts'],
      evaluationMethodology: 'Strict schema conformance and idempotency validation on external ingestion',
    };
  }

  private assessNetworkOptimisationReadiness(coordCompleteness: number): CapabilityReadinessAudit {
    return {
      capabilityName: 'Feature 6: Network Optimisation',
      readinessLevel: coordCompleteness >= 80 ? ReadinessLevel.PILOT_READY : ReadinessLevel.PROTOTYPE_ONLY,
      requiredObservations: 20,
      currentObservations: Math.round(coordCompleteness),
      dataReadinessScore: Math.round(coordCompleteness),
      blockers:
        coordCompleteness < 80
          ? ['Accurate distance calculation requires valid geographical coordinates for all recipients.']
          : [],
      assumptions: ['Bipartite matching respects species suitability, dietary rules, and open hours'],
      evaluationMethodology: 'Comparative route distance and allocation capacity utilization against unoptimized baseline',
    };
  }
}
