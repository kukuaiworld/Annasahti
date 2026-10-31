export interface AuthConfig {
  supabaseUrl: string;
  supabaseJwtIssuer: string;
  supabaseJwtAudience: string;
  supabaseJwksUrl: string;
}

export const authConfig = (): { auth: AuthConfig } => {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const defaultIssuer = `${supabaseUrl}/auth/v1`;
  const defaultJwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

  return {
    auth: {
      supabaseUrl,
      supabaseJwtIssuer: process.env.SUPABASE_JWT_ISSUER || defaultIssuer,
      supabaseJwtAudience: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated',
      supabaseJwksUrl: process.env.SUPABASE_JWKS_URL || defaultJwksUrl,
    },
  };
};
