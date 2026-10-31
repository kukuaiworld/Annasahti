import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JWTVerifyGetKey, JWTPayload } from 'jose';

export interface VerifiedJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
}

@Injectable()
export class JwtVerificationService {
  private readonly logger = new Logger(JwtVerificationService.name);
  private jwks?: JWTVerifyGetKey;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwksUrl: string;
  private josePromise?: Promise<typeof import('jose')>;

  constructor(private readonly configService: ConfigService) {
    this.issuer =
      this.configService.get<string>('auth.supabaseJwtIssuer') ||
      process.env.SUPABASE_JWT_ISSUER ||
      'https://placeholder-project.supabase.co/auth/v1';

    this.audience =
      this.configService.get<string>('auth.supabaseJwtAudience') ||
      process.env.SUPABASE_JWT_AUDIENCE ||
      'authenticated';

    this.jwksUrl =
      this.configService.get<string>('auth.supabaseJwksUrl') ||
      process.env.SUPABASE_JWKS_URL ||
      'https://placeholder-project.supabase.co/auth/v1/.well-known/jwks.json';
  }

  /**
   * Dynamically loads the pure ESM jose library safely in CommonJS runtime environments.
   * Does not permanently cache rejected promises, allowing retry on subsequent attempts.
   * Avoids eval and user-controlled dynamic imports.
   */
  private async getJose(): Promise<typeof import('jose')> {
    if (!this.josePromise) {
      try {
        const dynamicImport = new Function('return import("jose")');
        const promise = dynamicImport() as Promise<typeof import('jose')>;
        this.josePromise = promise.catch((err) => {
          this.josePromise = undefined;
          throw err;
        });
      } catch (syncErr) {
        this.josePromise = undefined;
        throw syncErr;
      }
    }
    return this.josePromise;
  }

  /**
   * Lazily initializes the remote JWKS key resolver.
   */
  private async getJwks(): Promise<JWTVerifyGetKey> {
    if (!this.jwks) {
      const jose = await this.getJose();
      try {
        this.jwks = jose.createRemoteJWKSet(new URL(this.jwksUrl), {
          cooldownDuration: 30000, // 30s cooldown between fetch errors
          cacheMaxAge: 600000,    // 10m cache TTL
        });
      } catch (err: any) {
        this.logger.error(`Failed to initialize remote JWKS at ${this.jwksUrl}: ${err.message}`);
        throw new UnauthorizedException('Authentication service temporarily unavailable.');
      }
    }
    return this.jwks;
  }

  /**
   * Allows setting a custom key resolver (used for hermetic unit and integration testing)
   */
  public setKeyResolver(keyResolver: JWTVerifyGetKey): void {
    this.jwks = keyResolver;
  }

  /**
   * Cryptographically verifies a Supabase-issued Bearer JWT.
   * Enforces algorithm, signature, expiration, issuer, audience, and non-empty subject.
   */
  async verifyToken(token: string): Promise<VerifiedJwtPayload> {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Authentication token must be provided.');
    }

    const jose = await this.getJose();
    const jwksResolver = await this.getJwks();

    try {
      const { payload } = await jose.jwtVerify(token, jwksResolver, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256', 'ES256'],
      });

      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Invalid token payload: missing subject.');
      }

      return payload as VerifiedJwtPayload;
    } catch (error: any) {
      this.logger.warn(`JWT cryptographic verification failed: ${error.message} (${error.code || 'UNKNOWN'})`);
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }
}
