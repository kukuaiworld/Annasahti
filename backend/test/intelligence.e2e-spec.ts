import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { generateKeyPair, SignJWT } from 'jose';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { SimulationScenarioType, EmergencyType } from '../src/intelligence/enums/simulation-scenario.enum';
import { ForpRecordType } from '../src/intelligence/enums/forp-version.enum';

describe('Advanced Intelligence Layer (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let keyPair: Awaited<ReturnType<typeof generateKeyPair>>;

  const issuer = 'http://127.0.0.1:54321/auth/v1';
  const audience = 'authenticated';
  const testUserId = 'u8888888-8888-8888-8888-888888888888';

  let token: string;

  beforeAll(async () => {
    keyPair = await generateKeyPair('ES256');

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
    authService.setKeyResolver(() => Promise.resolve(keyPair.publicKey));

    await app.init();

    const now = Math.floor(Date.now() / 1000);
    token = await new SignJWT({
      sub: testUserId,
      email: 'analyst@foodloop.org',
      role: 'authenticated',
      is_platform_reviewer: true,
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Data Readiness Assessment', () => {
    it('GET /api/v1/intelligence/readiness should return readiness scores across 6 capabilities', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/intelligence/readiness')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.overallScore).toBeDefined();
      expect(res.body.overallGrade).toBeDefined();
      expect(res.body.capabilities).toHaveLength(6);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/intelligence/quality-report should return dataset completeness and anomalies', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/intelligence/quality-report')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.datasets)).toBe(true);
      expect(res.body.datasets.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Waste Pattern Detective', () => {
    it('GET /api/v1/intelligence/waste-patterns should return descriptive surplus analysis', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/intelligence/waste-patterns')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.observedPatterns).toBeDefined();
      expect(Array.isArray(res.body.observedPatterns.peakDays)).toBe(true);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
    });

    it('GET /api/v1/intelligence/waste-forecasts should provide baseline moving average forecast with intervals', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/intelligence/waste-forecasts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.isModelTrainedOnRealData).toBeDefined();
    });
  });

  describe('3. Digital Twin Simulation Sandbox', () => {
    let simulationId: string;

    it('POST /api/v1/intelligence/simulations should execute simulation and label as simulated', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/intelligence/simulations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          scenarioType: SimulationScenarioType.VOLUNTEER_SHORTAGE,
          volunteerAvailabilityChangePercent: -40,
          surplusVolumeChangePercent: 20,
          notes: 'Driver shortage during holiday week',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.isSimulatedOutput).toBe(true);
      expect(res.body.projectedMetrics.estimatedSuccessfulDeliveries).toBeDefined();
      expect(res.body.disclaimer).toContain('NEVER be reported as real operational impact');

      simulationId = res.body.id;
    });

    it('GET /api/v1/intelligence/simulations/:id should retrieve simulation run', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/intelligence/simulations/${simulationId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(simulationId);
      expect(res.body.isSimulatedOutput).toBe(true);
    });
  });

  describe('4. Emergency Resilience Scenarios', () => {
    let scenarioId: string;

    it('POST /api/v1/intelligence/emergency-scenarios should create disruption scenario with human review requirement', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/intelligence/emergency-scenarios')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emergencyType: EmergencyType.ROAD_CLOSURE,
          affectedZone: 'North Sector Freeway',
          description: 'Bridge collapse blocks primary transport corridor',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.requiresHumanReview).toBe(true);
      expect(res.body.status).toBe('pending_review');

      scenarioId = res.body.id;
    });

    it('GET /api/v1/intelligence/emergency-scenarios/:id should retrieve scenario details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/intelligence/emergency-scenarios/${scenarioId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(scenarioId);
    });
  });

  describe('5. Counterfactual Impact Analysis', () => {
    let analysisId: string;

    it('POST /api/v1/intelligence/counterfactual-analysis should compute net additionality', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/intelligence/counterfactual-analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({
          baselineDiscardRate: 0.65,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.counterfactualEstimates.estimatedDiscardAvoidedKg).toBeDefined();
      expect(res.body.counterfactualEstimates.co2eAvoidedKgEstimated).toBeDefined();
      expect(res.body.uncertaintyAndSensitivity.confidenceLevel).toBe(0.9);

      analysisId = res.body.id;
    });

    it('GET /api/v1/intelligence/counterfactual-analysis/:id should retrieve counterfactual analysis', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/intelligence/counterfactual-analysis/${analysisId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(analysisId);
    });
  });

  describe('6. Network Optimisation', () => {
    let planId: string;

    it('POST /api/v1/intelligence/optimisation-runs should produce matching plan with explanations', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/intelligence/optimisation-runs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          maxDistanceKm: 30,
          objectiveStrategy: 'maximize_redistribution',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.algorithm).toBeDefined();
      expect(res.body.metrics.capacityUtilisationPercent).toBeDefined();

      planId = res.body.id;
    });

    it('GET /api/v1/intelligence/optimisation-runs/:id should retrieve plan', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/intelligence/optimisation-runs/${planId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(planId);
    });
  });

  describe('7. Open Rescue Protocol (FORP)', () => {
    it('GET /api/v1/protocol/forp/v1.0.0/schema should return standard schemas (public access)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/protocol/forp/v1.0.0/schema')
        .expect(200);

      expect(res.body.protocol).toBe('Food Open Rescue Protocol (FORP)');
      expect(res.body.version).toBe('v1.0.0');
      expect(res.body.schemas.food_donation).toBeDefined();
    });

    it('POST /api/v1/protocol/forp/v1.0.0/validate should validate compliant external partner payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/protocol/forp/v1.0.0/validate')
        .send({
          recordType: ForpRecordType.FOOD_DONATION,
          payload: {
            donationId: 'ext-don-999',
            donorOrganisationId: 'ext-org-555',
            foodName: 'Canned Lentils',
            category: 'human_consumption',
            quantity: 120,
            unit: 'kg',
          },
        })
        .expect(200);

      expect(res.body.isValid).toBe(true);
      expect(res.body.errors).toHaveLength(0);
    });

    it('POST /api/v1/protocol/forp/v1.0.0/validate should detect non-compliant external partner payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/protocol/forp/v1.0.0/validate')
        .send({
          recordType: ForpRecordType.FOOD_DONATION,
          payload: {
            donationId: 'ext-don-invalid',
            // Missing foodName, category, quantity, unit
          },
        })
        .expect(200);

      expect(res.body.isValid).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });
});
