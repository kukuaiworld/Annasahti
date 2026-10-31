export interface AuthenticatedUser {
  id: string; // Supabase auth.users UUID (sub claim)
  email?: string;
  role: string; // Supabase JWT role (e.g. 'authenticated')
  sessionClaims?: Record<string, unknown>;
}
