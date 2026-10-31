import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNPROVISIONED_KEY = 'allowUnprovisioned';
/**
 * Decorator to explicitly allow authenticated but unprovisioned users
 * (e.g. for dedicated onboarding operations).
 */
export const AllowUnprovisioned = () => SetMetadata(ALLOW_UNPROVISIONED_KEY, true);
