import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import type * as JoseTypes from 'jose';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { OrganisationType } from '../src/organisations/enums/organisation-type.enum';
import { VerificationStatus } from '../src/organisations/enums/verification-status.enum';
import { FoodCategory } from '../src/organisations/enums/food-category.enum';
import { ReviewDecisionType } from '../src/organisations/dto/verification-decision.dto';
import { DocumentType } from '../src/organisations/entities/organisation-document.entity';

describe('Organisations Module (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jose: typeof JoseTypes;
  let keyPair: JoseTypes.GenerateKeyPairResult;

  const issuer = 'http://127.0.0.1:54321/auth/v1';
  const audience = 'authenticated';

  const userAId = 'a1111111-1111-1111-1111-111111111111';
  const userBId = 'b2222222-2222-2222-2222-222222222222';
  const reviewerId = 'r9999999-9999-9999-9999-999999999999';

  let tokenUserA: string;
  let tokenUserB: string;
  let tokenReviewer: string;

  let orgAId: string;

  beforeAll(async () => {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    jose = await dynamicImport('jose');
    keyPair = await jose.generateKeyPair('ES256');

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

    // Generate JWT tokens
    const now = Math.floor(Date.now() / 1000);

    tokenUserA = await new jose.SignJWT({
      sub: userAId,
      email: 'usera@ngo.org',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    tokenUserB = await new jose.SignJWT({
      sub: userBId,
      email: 'userb@restaurant.com',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    tokenReviewer = await new jose.SignJWT({
      sub: reviewerId,
      email: 'reviewer@foodloop.org',
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

  describe('1. Organisation Registration', () => {
    it('POST /api/v1/organisations should create organisation in PENDING status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Annam Relief Foundation',
          organisationType: OrganisationType.HUMANITARIAN_NGO,
          description: 'Emergency food rescue and redistribution',
          address: '100 Relief Way, Chennai, TN',
          contactEmail: 'contact@annamrelief.org',
          latitude: 13.0827,
          longitude: 80.2707,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Annam Relief Foundation');
      expect(res.body.verificationStatus).toBe(VerificationStatus.PENDING);
      expect(res.body.location).toEqual({ latitude: 13.0827, longitude: 80.2707 });

      orgAId = res.body.id;
    });

    it('POST /api/v1/organisations should reject duplicate names with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          name: 'Annam Relief Foundation',
          organisationType: OrganisationType.RESTAURANT,
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('POST /api/v1/organisations should reject invalid payload with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          // Missing required name and organisationType
          description: 'No name provided',
        })
        .expect(400);
    });
  });

  describe('2. Profile Management & Cross-Tenant Access Restrictions', () => {
    it('GET /api/v1/organisations/me should return caller administered organisations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/organisations/me')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(orgAId);
    });

    it('PATCH /api/v1/organisations/me should update current user organisation', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/organisations/me')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Updated mission: Zero hunger, zero waste',
        })
        .expect(200);

      expect(res.body.description).toBe('Updated mission: Zero hunger, zero waste');
    });

    it('PUT /api/v1/organisations/:id/operating-hours should update schedule for admin', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/organisations/${orgAId}/operating-hours`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          timezone: 'Asia/Kolkata',
          monday: { open: '08:00', close: '20:00', closed: false },
          sunday: { closed: true },
        })
        .expect(200);

      expect(res.body.operatingHours.timezone).toBe('Asia/Kolkata');
      expect(res.body.operatingHours.monday.open).toBe('08:00');
      expect(res.body.operatingHours.sunday.closed).toBe(true);
    });

    it('PUT /api/v1/organisations/:id/operating-hours should deny cross-tenant modification (User B modifying Org A)', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/organisations/${orgAId}/operating-hours`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          timezone: 'Asia/Kolkata',
        })
        .expect(403);
    });
  });

  describe('3. Document Metadata Submission & Review Submission', () => {
    it('POST /api/v1/organisations/:id/submit-verification should fail with 400 when 0 documents uploaded', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/organisations/${orgAId}/submit-verification`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(400);
    });

    it('POST /api/v1/organisations/:id/documents should submit document metadata', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/organisations/${orgAId}/documents`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          documentType: DocumentType.BUSINESS_REGISTRATION,
          storagePath: 'vault/organisations/orgA/reg-cert.pdf',
          originalFilename: 'reg-cert.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1048576,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.organisationId).toBe(orgAId);
      expect(res.body.reviewStatus).toBe('pending');
    });

    it('GET /api/v1/organisations/:id/documents should list organisation documents', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organisations/${orgAId}/documents`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('POST /api/v1/organisations/:id/submit-verification should succeed after document upload', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/organisations/${orgAId}/submit-verification`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(res.body.documentsCount).toBe(1);
      expect(res.body.message).toContain('submitted successfully');
    });
  });

  describe('4. Platform Verification Decisions & Self-Approval Prevention', () => {
    it('GET /api/v1/admin/organisations/pending should deny access to ordinary organisation admin (User A)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/organisations/pending')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(403);
    });

    it('GET /api/v1/admin/organisations/pending should allow platform reviewer', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/organisations/pending')
        .set('Authorization', `Bearer ${tokenReviewer}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((o: { id: string }) => o.id === orgAId);
      expect(found).toBeDefined();
    });

    it('POST /api/v1/admin/organisations/:id/verification-decision should prevent self-approval if reviewer belongs to org', async () => {
      // User A (creator/admin of Org A) tries to act as platform reviewer to approve Org A
      const rogueReviewerToken = await new jose.SignJWT({
        sub: userAId, // SAME as creator of Org A!
        email: 'usera@ngo.org',
        role: 'authenticated',
        is_platform_reviewer: true,
      })
        .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
        .setIssuer(issuer)
        .setAudience(audience)
        .setIssuedAt(Math.floor(Date.now() / 1000))
        .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
        .sign(keyPair.privateKey);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/organisations/${orgAId}/verification-decision`)
        .set('Authorization', `Bearer ${rogueReviewerToken}`)
        .send({
          decision: ReviewDecisionType.VERIFIED,
          notes: 'Attempting self verification',
        })
        .expect(403);

      expect(res.body.message).toContain('Self-approval violation');
    });

    it('POST /api/v1/admin/organisations/:id/verification-decision should allow independent platform reviewer to verify', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/organisations/${orgAId}/verification-decision`)
        .set('Authorization', `Bearer ${tokenReviewer}`)
        .send({
          decision: ReviewDecisionType.VERIFIED,
          notes: 'Verified against NGO Darpan registration registry.',
        })
        .expect(200);

      expect(res.body.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(res.body.verifiedBy).toBe(reviewerId);
      expect(res.body.verifiedAt).toBeDefined();
    });
  });

  describe('5. Recipient Capacity, Food Acceptance & Safety Rules', () => {
    it('PUT /api/v1/organisations/:id/capacity should configure intake quota with explicit units', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/organisations/${orgAId}/capacity`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          requestedQuantity: 500,
          quantityUnit: 'kg',
          storageCapacityKg: 1000,
        })
        .expect(200);

      expect(res.body.requestedQuantity).toBe(500);
      expect(res.body.quantityUnit).toBe('kg');
      expect(res.body.storageCapacityKg).toBe(1000);
    });

    it('FOOD SAFETY: PUT /api/v1/organisations/:id/food-acceptance should reject animal food without prior species configuration', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/organisations/${orgAId}/food-acceptance`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          acceptedCategories: [FoodCategory.ANIMAL_APPROPRIATE],
        })
        .expect(400);
    });

    it('FOOD SAFETY: PUT /api/v1/organisations/:id/recipient-requirements should configure dietary & species requirements', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/organisations/${orgAId}/recipient-requirements`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          acceptedCategories: [FoodCategory.HUMAN_CONSUMPTION, FoodCategory.ANIMAL_APPROPRIATE],
          requestedQuantity: 400,
          quantityUnit: 'kg',
          storageCapacityKg: 800,
          dietaryRequirements: {
            isVegetarianOnly: true,
            prohibitedAllergens: ['peanuts', 'tree_nuts'],
            halalCertifiedRequired: false,
            customDietaryNotes: 'Strict vegetarian community kitchen',
          },
          speciesRequirements: {
            targetSpecies: ['canine', 'bovine'],
            prohibitedIngredients: ['alliums', 'theobromine', 'xylitol'],
            handlingInstructions: 'Vegetable peelings and grains for cattle, boiled rice for dogs',
          },
        })
        .expect(200);

      expect(res.body.acceptedCategories).toContain(FoodCategory.HUMAN_CONSUMPTION);
      expect(res.body.acceptedCategories).toContain(FoodCategory.ANIMAL_APPROPRIATE);
      expect(res.body.dietaryRequirements.isVegetarianOnly).toBe(true);
      expect(res.body.speciesRequirements.targetSpecies).toEqual(['canine', 'bovine']);
    });

    it('GET /api/v1/organisations/:id/recipient-requirements should return full configured requirements', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organisations/${orgAId}/recipient-requirements`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(res.body.requestedQuantity).toBe(400);
      expect(res.body.quantityUnit).toBe('kg');
      expect(res.body.speciesRequirements.targetSpecies).toEqual(['canine', 'bovine']);
    });
  });
});
