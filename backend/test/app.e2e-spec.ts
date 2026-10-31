import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import type * as JoseTypes from 'jose';
import { AppModule } from './../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { DatabaseService } from '../src/database/database.service';

describe('FoodLoop API (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jose: typeof JoseTypes;
  let keyPair: JoseTypes.GenerateKeyPairResult;
  let adminToken: string;
  let volunteerToken: string;

  const issuer = 'http://127.0.0.1:54321/auth/v1';
  const audience = 'authenticated';

  const mockDbService: any = {
    query: jest.fn().mockResolvedValue([]),
    queryOne: jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('impact_methodologies')) {
        return Promise.resolve({
          id: 'method-1',
          methodology_code: 'CO2E_AVOIDED_EPA_WARM_V1',
          version: '1.0.0',
          description: 'EPA WARM v16 Food Waste Landfill Diversion Model',
          source_reference: 'US EPA Waste Reduction Model',
          assumptions: { human_food_diversion_kg_co2e_per_kg: 2.5 },
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
      if (sql.includes('FROM public.profiles WHERE') || sql.includes('FROM profiles WHERE')) {
        return Promise.resolve({
          id: '11111111-1111-1111-1111-111111111111',
          full_name: 'Test Admin',
          role: 'admin',
        });
      }
      return Promise.resolve(null);
    }),
    transaction: jest.fn((cb) => cb(mockDbService)),
  };

  beforeAll(async () => {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    jose = await dynamicImport('jose');
    keyPair = await jose.generateKeyPair('ES256');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDbService)
      .compile();

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
    authService.setKeyResolver(() => Promise.resolve(keyPair.publicKey));

    const now = Math.floor(Date.now() / 1000);
    adminToken = await new jose.SignJWT({
      sub: '11111111-1111-1111-1111-111111111111',
      email: 'admin@foodloop.org',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    volunteerToken = await new jose.SignJWT({
      sub: '11111111-1111-1111-1111-111111111111',
      email: 'volunteer@foodloop.org',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'FoodLoop API',
      });
  });

  it('should reject unauthenticated request to /api/v1/batches with 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/batches')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('should reject unauthenticated request to /api/v1/allocations with 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/allocations')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('should reject unauthenticated request to /api/v1/deliveries with 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/deliveries')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('should reject unauthenticated request to /api/v1/impact/overview with 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/impact/overview')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/api/v1/impact/definitions (GET) with auth headers', () => {
    return request(app.getHttpServer())
      .get('/api/v1/impact/definitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body.some((m: any) => m.metricKey === 'meals_rescued')).toBe(true);
      });
  });

  it('/api/v1/impact/co2e/methodology (GET) with auth headers', () => {
    return request(app.getHttpServer())
      .get('/api/v1/impact/co2e/methodology')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.methodologyCode).toBe('CO2E_AVOIDED_EPA_WARM_V1');
      });
  });

  it('should reject unauthenticated request to /api/v1/recognition/me with 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/recognition/me')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/api/v1/recognition/certificates/verify/:code (GET) is public and returns 200 without auth token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/recognition/certificates/verify/FL-CERT-NONEXISTENT')
      .expect(200)
      .expect((res) => {
        expect(res.body.isValid).toBe(false);
        expect(res.body.status).toBe('not_found');
      });
  });

  it('/api/v1/recognition/leaderboard (GET) with auth headers', () => {
    return request(app.getHttpServer())
      .get('/api/v1/recognition/leaderboard')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.period).toBe('monthly');
        expect(Array.isArray(res.body.entries)).toBe(true);
      });
  });
});
