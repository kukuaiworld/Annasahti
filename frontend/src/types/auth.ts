import { Session, User } from '@supabase/supabase-js';

export enum AppRole {
  DONOR = 'donor',
  RECIPIENT = 'recipient',
  VOLUNTEER = 'volunteer',
  INSPECTOR = 'inspector',
  ADMIN = 'admin',
}

export interface UserProfile {
  id: string;
  fullName: string;
  role?: AppRole;
  avatarUrl?: string | null;
  bio?: string | null;
  organisationId?: string;
  organisationRole?: AppRole;
  joinedAt?: string;
}

export interface Organisation {
  id: string;
  name: string;
  organisation_type: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  latitude?: number;
  longitude?: number;
  operating_hours?: Record<string, string>;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  organisation: Organisation | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
