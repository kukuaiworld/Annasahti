export enum ReadinessLevel {
  NOT_READY = 'not_ready',             // Insufficient data (< 30 observations or severe missing fields)
  PROTOTYPE_ONLY = 'prototype_only',   // Descriptive analytics possible; insufficient for predictive ML
  PILOT_READY = 'pilot_ready',         // Statistical baseline models possible with human review
  PRODUCTION_READY = 'production_ready' // High-quality, statistically significant verified operational data
}

export enum DataQualityGrade {
  CRITICAL = 'critical',   // > 20% invalid or missing mandatory fields
  POOR = 'poor',           // 10-20% anomalies or gaps
  ACCEPTABLE = 'acceptable', // 5-10% non-critical gaps
  EXCELLENT = 'excellent'  // < 5% anomalies, high completeness
}
