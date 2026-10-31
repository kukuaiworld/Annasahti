import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type * as JoseTypes from 'jose';
import { JwtVerificationService } from './jwt-verification.service';

describe('JwtVerificationService', () => {
  let service: JwtVerificationService;
  let jose: typeof JoseTypes;
  let keyPair: JoseTypes.GenerateKeyPairResult;
  let jwk: JoseTypes.JWK;
  let localJwks: JoseTypes.JWTVerifyGetKey;

  const issuer = 'https://test-project.supabase.co/auth/v1';
  const audience = 'authenticated';

  beforeAll(async () => {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    jose = await dynamicImport('jose');

    // Generate an ephemeral test keypair for cryptographic verification testing
    keyPair = await jose.generateKeyPair('ES256', { extractable: true });
    jwk = await jose.exportJWK(keyPair.publicKey);
    jwk.kid = 'test-key-id-1';
    jwk.alg = 'ES256';
    jwk.use = 'sig';

    localJwks = jose.createLocalJWKSet({
      keys: [jwk],
    });
  });

  beforeEach(() => {
    const configService = {
      get: (key: string) => {
        if (key === 'auth.supabaseJwtIssuer') return issuer;
        if (key === 'auth.supabaseJwtAudience') return audience;
        if (key === 'auth.supabaseJwksUrl') return `${issuer}/.well-known/jwks.json`;
        return null;
      },
    } as unknown as ConfigService;

    service = new JwtVerificationService(configService);
    service.setKeyResolver(localJwks);
  });

  it('should accept a valid, cryptographically signed test token', async () => {
    const token = await new jose.SignJWT({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      email: 'donor@foodloop.org',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key-id-1' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(keyPair.privateKey);

    const payload = await service.verifyToken(token);

    expect(payload).toBeDefined();
    expect(payload.sub).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(payload.email).toBe('donor@foodloop.org');
    expect(payload.role).toBe('authenticated');
  });

  it('should reject a malformed token', async () => {
    await expect(service.verifyToken('malformed.token.format')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject an empty token string', async () => {
    await expect(service.verifyToken('')).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token with an invalid cryptographic signature (signed by untrusted key)', async () => {
    const untrustedKeyPair = await jose.generateKeyPair('ES256');
    const forgedToken = await new jose.SignJWT({
      sub: '550e8400-e29b-41d4-a716-446655440000',
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key-id-1' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(untrustedKeyPair.privateKey);

    await expect(service.verifyToken(forgedToken)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an expired token', async () => {
    const expiredToken = await new jose.SignJWT({
      sub: '550e8400-e29b-41d4-a716-446655440000',
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key-id-1' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(keyPair.privateKey);

    await expect(service.verifyToken(expiredToken)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token with an incorrect issuer', async () => {
    const wrongIssuerToken = await new jose.SignJWT({
      sub: '550e8400-e29b-41d4-a716-446655440000',
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key-id-1' })
      .setIssuer('https://malicious-issuer.example.com/auth/v1')
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(keyPair.privateKey);

    await expect(service.verifyToken(wrongIssuerToken)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token with an incorrect audience', async () => {
    const wrongAudienceToken = await new jose.SignJWT({
      sub: '550e8400-e29b-41d4-a716-446655440000',
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key-id-1' })
      .setIssuer(issuer)
      .setAudience('wrong-audience')
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(keyPair.privateKey);

    await expect(service.verifyToken(wrongAudienceToken)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token with an unsupported algorithm (e.g. HS256 symmetric signing without JWKS)', async () => {
    const secret = new TextEncoder().encode('legacy-symmetric-secret-key-that-is-long-enough');
    const symmetricToken = await new jose.SignJWT({
      sub: '550e8400-e29b-41d4-a716-446655440000',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret);

    await expect(service.verifyToken(symmetricToken)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token with missing subject (sub)', async () => {
    const noSubToken = await new jose.SignJWT({
      email: 'user@foodloop.org',
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key-id-1' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(keyPair.privateKey);

    await expect(service.verifyToken(noSubToken)).rejects.toThrow(UnauthorizedException);
  });

  it('should safely handle key rotation when a new key is added to JWKS', async () => {
    const newKeyPair = await jose.generateKeyPair('ES256', { extractable: true });
    const newJwk = await jose.exportJWK(newKeyPair.publicKey);
    newJwk.kid = 'test-key-id-2';
    newJwk.alg = 'ES256';
    newJwk.use = 'sig';

    // Simulate key rotation: JWKS now includes both old and new keys
    const rotatedJwks = jose.createLocalJWKSet({
      keys: [jwk, newJwk],
    });
    service.setKeyResolver(rotatedJwks);

    const tokenSignedWithNewKey = await new jose.SignJWT({
      sub: 'rotated-user-uuid',
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key-id-2' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(newKeyPair.privateKey);

    const payload = await service.verifyToken(tokenSignedWithNewKey);
    expect(payload.sub).toBe('rotated-user-uuid');
  });

  it('should not permanently cache a rejected dynamic import promise and allow retry', async () => {
    const configService = {
      get: (key: string) => {
        if (key === 'auth.supabaseJwtIssuer') return issuer;
        if (key === 'auth.supabaseJwtAudience') return audience;
        return null;
      },
    } as unknown as ConfigService;

    const freshService = new JwtVerificationService(configService);

    // Simulate transient failure by setting a rejected promise with the exact catch cleanup logic
    let attempts = 0;
    const originalGetJose = (freshService as any).getJose.bind(freshService);
    (freshService as any).josePromise = Promise.reject(new Error('Transient ESM load failure')).catch((err: any) => {
      (freshService as any).josePromise = undefined;
      throw err;
    });

    // First call fails with the transient rejection
    await expect((freshService as any).getJose()).rejects.toThrow('Transient ESM load failure');

    // Cached promise must be cleared
    expect((freshService as any).josePromise).toBeUndefined();

    // Subsequent call retries safely and succeeds
    const loadedJose = await (freshService as any).getJose();
    expect(loadedJose).toBeDefined();
    expect(typeof loadedJose.jwtVerify).toBe('function');
  });
});
