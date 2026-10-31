import { AppRole } from '../enums/app.enums';

export interface AuthUser {
  /** Verified Supabase user UUID (from JWT sub) */
  id: string;
  /** Verified user email address, if present in claims */
  email?: string;
  /** User full name resolved from database profile or email fallback */
  fullName: string;
  /** Verified FoodLoop application role from public.profiles table (undefined if unprovisioned) */
  role?: AppRole;
  /** Organisation membership ID if assigned */
  organisationId?: string;
  /** Organisation-scoped role if assigned */
  organisationRole?: AppRole;
  /** Supabase database role claim from cryptographically verified token (e.g. 'authenticated') */
  supabaseRole?: string;
}
