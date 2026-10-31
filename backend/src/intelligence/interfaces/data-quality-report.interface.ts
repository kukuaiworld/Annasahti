import { DataQualityGrade, ReadinessLevel } from '../enums/readiness-level.enum';

export interface DataFieldAnomaly {
  field: string;
  missingCount: number;
  invalidCount: number;
  anomalyRate: number; // 0.0 to 1.0
  description: string;
}

export interface OperationalDatasetAudit {
  datasetName: string;
  totalRecords: number;
  completeRecords: number;
  completenessPercentage: number;
  qualityGrade: DataQualityGrade;
  anomalies: DataFieldAnomaly[];
}

export interface CapabilityReadinessAudit {
  capabilityName: string; // e.g. "Waste Pattern Detective", "Digital Twin", etc.
  readinessLevel: ReadinessLevel;
  requiredObservations: number;
  currentObservations: number;
  dataReadinessScore: number; // 0 - 100
  blockers: string[];
  assumptions: string[];
  evaluationMethodology: string;
}

export interface SystemDataQualityReport {
  generatedAt: Date;
  overallScore: number; // 0 - 100
  overallGrade: DataQualityGrade;
  datasets: OperationalDatasetAudit[];
  capabilities: CapabilityReadinessAudit[];
  recommendations: string[];
}
