import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import type * as JoseTypes from 'jose';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Supabase Authentication (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jose: typeof JoseTypes;
  let keyPair: JoseTypes.GenerateKeyPairResult;
  let untrustedKeyPair: JoseTypes.GenerateKeyPairResult;

  const issuer = 'http://127.0.0.1:54321/auth/v1';
  const audience = 'authenticated';
  const testUserId = 'a0000000-0000-0000-0000-000000000001';
  const testUserEmail = 'volunteer@foodloop.org';

  beforeAll(async () => {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    jose = await dynamicImport('jose');
    keyPair = await jose.generateKeyPair('ES256');
    untrustedKeyPair = await jose.generateKeyPair('ES256');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    authService = moduleFixture.get<AuthService>(AuthService);
    // Wire test public key resolver for fast, hermetic verification
    authService.setKeyResolver(() => Promise.resolve(keyPair.publicKey));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Public Endpoint: GET /api/v1/health should be accessible without token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'FoodLoop API',
      });
  });

  it('Protected Endpoint: GET /api/v1/auth/me should reject request without Authorization header', () => {
    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toEqual(401);
        expect(res.body.message).toContain('Authorization header is missing');
      });
  });

  it('Protected Endpoint: GET /api/v1/auth/me should reject malformed Bearer header', () => {
    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toEqual(401);
        expect(res.body.message).toContain('Malformed Authorization header');
      });
  });

  it('Protected Endpoint: GET /api/v1/auth/me should reject token with invalid signature', async () => {
    const forgedToken = await new jose.SignJWT({
      role: 'authenticated',
      email: testUserEmail,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setSubject(testUserId)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(untrustedKeyPair.privateKey);

    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${forgedToken}`)
      .expect(401);
  });

  it('Protected Endpoint: GET /api/v1/auth/me should reject expired token', async () => {
    const expiredToken = await new jose.SignJWT({
      role: 'authenticated',
      email: testUserEmail,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setSubject(testUserId)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(keyPair.privateKey);

    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('Protected Endpoint: GET /api/v1/auth/me should reject token with invalid issuer', async () => {
    const badIssuerToken = await new jose.SignJWT({
      role: 'authenticated',
      email: testUserEmail,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setSubject(testUserId)
      .setIssuer('https://malicious.example.com/auth/v1')
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(keyPair.privateKey);

    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${badIssuerToken}`)
      .expect(401);
  });

  it('Protected Endpoint: GET /api/v1/auth/me should reject token with invalid audience', async () => {
    const badAudienceToken = await new jose.SignJWT({
      role: 'authenticated',
      email: testUserEmail,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setSubject(testUserId)
      .setIssuer(issuer)
      .setAudience('wrong-audience')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(keyPair.privateKey);

    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${badAudienceToken}`)
      .expect(401);
  });

  it('Protected Endpoint: GET /api/v1/auth/me should accept valid token and return verified user context', async () => {
    const validToken = await new jose.SignJWT({
      role: 'authenticated',
      email: testUserEmail,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setSubject(testUserId)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(keyPair.privateKey);

    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toEqual('ok');
        expect(res.body.user).toBeDefined();
        expect(res.body.user.id).toEqual(testUserId);
        expect(res.body.user.email).toEqual(testUserEmail);
        expect(res.body.user.role).toEqual('authenticated');
        expect(res.body.user.sessionClaims).toBeDefined();
        expect(res.body.user.sessionClaims.iss).toEqual(issuer);
        expect(res.body.user.sessionClaims.aud).toEqual(audience);
      });
  });
});
