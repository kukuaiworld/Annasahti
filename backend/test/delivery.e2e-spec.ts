import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { generateKeyPair, SignJWT } from 'jose';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  DELIVERY_TASK_REPOSITORY,
  IDeliveryTaskRepository,
} from '../src/delivery/repositories/delivery-task.repository.interface';
import { DeliveryStatus } from '../src/delivery/enums/delivery-status.enum';
import { DiscrepancyStatus } from '../src/delivery/enums/discrepancy.enum';
import { DeliveryTask } from '../src/delivery/entities/delivery-task.entity';

describe('Delivery & SafeChain Module (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let taskRepo: IDeliveryTaskRepository;
  let keyPair: Awaited<ReturnType<typeof generateKeyPair>>;

  const issuer = 'http://127.0.0.1:54321/auth/v1';
  const audience = 'authenticated';

  const volunteerAId = 'v1111111-1111-1111-1111-111111111111';
  const volunteerBId = 'v2222222-2222-2222-2222-222222222222';
  const recipientUserId = 'r3333333-3333-3333-3333-333333333333';
  const platformAdminId = 'p9999999-9999-9999-9999-999999999999';

  let tokenVolunteerA: string;
  let tokenVolunteerB: string;
  let tokenRecipient: string;
  let tokenAdmin: string;

  let seededTask: DeliveryTask;
  let seededQrToken: string;

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

    taskRepo = moduleFixture.get<IDeliveryTaskRepository>(DELIVERY_TASK_REPOSITORY);

    await app.init();

    // Generate test JWTs
    const now = Math.floor(Date.now() / 1000);

    tokenVolunteerA = await new SignJWT({
      sub: volunteerAId,
      email: 'volunteera@foodloop.org',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    tokenVolunteerB = await new SignJWT({
      sub: volunteerBId,
      email: 'volunteerb@foodloop.org',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    tokenRecipient = await new SignJWT({
      sub: recipientUserId,
      email: 'recipient@shelter.org',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    tokenAdmin = await new SignJWT({
      sub: platformAdminId,
      email: 'admin@foodloop.org',
      role: 'authenticated',
      is_platform_reviewer: true,
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(keyPair.privateKey);

    // Seed task and QR code
    seededTask = await taskRepo.createTask({
      allocatedQuantity: 50,
      quantityUnit: 'kg',
      foodName: 'Hot Veg Pulao & Gravy',
      foodCategory: 'human_consumption',
      status: DeliveryStatus.ASSIGNED,
    });

    const qr = await taskRepo.createQrCode(seededTask.batchId);
    seededQrToken = qr.qrToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Volunteer Task Discovery', () => {
    it('GET /api/v1/delivery-tasks/available should list open tasks', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/delivery-tasks/available')
        .set('Authorization', `Bearer ${tokenVolunteerA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((t: DeliveryTask) => t.id === seededTask.id);
      expect(found).toBeDefined();
      expect(found.foodName).toBe('Hot Veg Pulao & Gravy');
      expect(found.allocatedQuantity).toBe(50);
    });
  });

  describe('2. Task Acceptance & Concurrent Conflict Prevention', () => {
    it('POST /api/v1/delivery-tasks/:id/accept should assign task to volunteer A', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/accept`)
        .set('Authorization', `Bearer ${tokenVolunteerA}`)
        .expect(200);

      expect(res.body.status).toBe(DeliveryStatus.ACCEPTED);
      expect(res.body.volunteerId).toBe(volunteerAId);
    });

    it('POST /api/v1/delivery-tasks/:id/accept should prevent volunteer B from double-accepting the same task', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/accept`)
        .set('Authorization', `Bearer ${tokenVolunteerB}`)
        .expect(409);

      expect(res.body.message).toMatch(/cannot be accepted|already assigned/);
    });

    it('GET /api/v1/delivery-tasks/my-tasks should show accepted task for volunteer A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/delivery-tasks/my-tasks')
        .set('Authorization', `Bearer ${tokenVolunteerA}`)
        .expect(200);

      expect(res.body.some((t: DeliveryTask) => t.id === seededTask.id)).toBe(true);
    });
  });

  describe('3. Volunteer Rejection & Reassignment', () => {
    it('POST /api/v1/delivery-tasks/:id/reject should require non-empty reason', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/reject`)
        .set('Authorization', `Bearer ${tokenVolunteerA}`)
        .send({})
        .expect(400);
    });

    it('POST /api/v1/delivery-tasks/:id/reject should release task back to available pool', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/reject`)
        .set('Authorization', `Bearer ${tokenVolunteerA}`)
        .send({ reason: 'Vehicle tyre puncture, unable to reach donor kitchen.' })
        .expect(200);

      expect(res.body.status).toBe(DeliveryStatus.ASSIGNED);
      expect(res.body.volunteerId).toBeUndefined();
    });

    it('POST /api/v1/delivery-tasks/:id/accept should now allow volunteer B to accept the released task', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/accept`)
        .set('Authorization', `Bearer ${tokenVolunteerB}`)
        .expect(200);

      expect(res.body.status).toBe(DeliveryStatus.ACCEPTED);
      expect(res.body.volunteerId).toBe(volunteerBId);
    });
  });

  describe('4. QR Identification & Verification', () => {
    it('GET /api/v1/batches/:id/qr should return cryptographic QR token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/batches/${seededTask.batchId}/qr`)
        .set('Authorization', `Bearer ${tokenVolunteerB}`)
        .expect(200);

      expect(res.body.batchId).toBe(seededTask.batchId);
      expect(res.body.qrToken).toBeDefined();
    });

    it('POST /api/v1/batches/resolve-qr should validate valid QR token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/batches/resolve-qr')
        .set('Authorization', `Bearer ${tokenVolunteerB}`)
        .send({ qrToken: seededQrToken })
        .expect(200);

      expect(res.body.batchId).toBe(seededTask.batchId);
      expect(res.body.isActive).toBe(true);
    });
  });

  describe('5. Pickup Confirmation', () => {
    it('POST /api/v1/delivery-tasks/:id/pickup-confirmation should reject if scanned QR does not match batch', async () => {
      const unrelatedQr = await taskRepo.createQrCode('different-batch-uuid');

      await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/pickup-confirmation`)
        .set('Authorization', `Bearer ${tokenVolunteerB}`)
        .send({
          qrToken: unrelatedQr.qrToken,
          collectedQuantity: 50,
          quantityUnit: 'kg',
        })
        .expect(400);
    });

    it('POST /api/v1/delivery-tasks/:id/pickup-confirmation should confirm pickup and transition to in_transit', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/pickup-confirmation`)
        .set('Authorization', `Bearer ${tokenVolunteerB}`)
        .send({
          qrToken: seededQrToken,
          collectedQuantity: 50,
          quantityUnit: 'kg',
          temperatureC: 62.5,
          handlingNotes: 'Food packed in commercial insulated food warmers.',
        })
        .expect(200);

      expect(res.body.status).toBe(DeliveryStatus.PICKUP_CONFIRMED);
      expect(res.body.collectedQuantity).toBe(50);
      expect(res.body.pickupConfirmedAt).toBeDefined();
    });
  });

  describe('6. Delivery Confirmation, Impersonation Prevention & Partial Delivery', () => {
    it('SECURITY: Volunteer cannot confirm delivery receipt (must be recipient)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/delivery-confirmation`)
        .set('Authorization', `Bearer ${tokenVolunteerB}`) // VOLUNTEER ATTEMPT!
        .send({
          receivedQuantity: 50,
          quantityUnit: 'kg',
        })
        .expect(403);
    });

    it('CRITICAL: Recipient confirms partial delivery (42 kg received vs 50 kg picked up)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/delivery-confirmation`)
        .set('Authorization', `Bearer ${tokenRecipient}`)
        .send({
          receivedQuantity: 42,
          quantityUnit: 'kg',
          recipientNotes: 'Accepted hot food. 8 kg spill occurred during transport.',
        })
        .expect(200);

      expect(res.body.receivedQuantity).toBe(42);
      expect(res.body.confirmedBy).toBe(recipientUserId);

      // Verify task details
      const taskRes = await request(app.getHttpServer())
        .get(`/api/v1/delivery-tasks/${seededTask.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(taskRes.body.status).toBe(DeliveryStatus.DELIVERED);
      // Independent quantity ledger preservation
      expect(taskRes.body.allocatedQuantity).toBe(50);
      expect(taskRes.body.collectedQuantity).toBe(50);
    });

    it('GET /api/v1/delivery-tasks/:id/discrepancies should record 8 kg missing quantity', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/delivery-tasks/${seededTask.id}/discrepancies`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].discrepancyQuantity).toBe(8);
      expect(res.body[0].type).toBe('missing_unaccounted');
    });

    it('POST /api/v1/delivery-tasks/:id/delivery-confirmation should reject duplicate confirmation', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/delivery-tasks/${seededTask.id}/delivery-confirmation`)
        .set('Authorization', `Bearer ${tokenRecipient}`)
        .send({
          receivedQuantity: 42,
          quantityUnit: 'kg',
        })
        .expect(409);
    });
  });

  describe('7. SafeChain Traceability & Event History', () => {
    it('GET /api/v1/batches/:id/safechain should return append-only history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/batches/${seededTask.batchId}/safechain`)
        .set('Authorization', `Bearer ${tokenVolunteerB}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4);
      const eventTypes = res.body.map((e: { eventType: string }) => e.eventType);
      expect(eventTypes).toContain('task_accepted');
      expect(eventTypes).toContain('pickup_confirmed');
      expect(eventTypes).toContain('partial_delivery_confirmed');
      expect(eventTypes).toContain('delivered');
    });
  });

  describe('8. Administrative Reassignment & Discrepancy Resolution', () => {
    it('POST /api/v1/admin/delivery-tasks/:id/resolve-discrepancy should resolve discrepancy', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/delivery-tasks/${seededTask.id}/resolve-discrepancy`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          status: DiscrepancyStatus.RESOLVED,
          resolutionNotes: 'Loss verified with volunteer dashcam footage. Written off to transit accident account.',
        })
        .expect(200);

      expect(res.body.status).toBe(DiscrepancyStatus.RESOLVED);
      expect(res.body.resolvedBy).toBe(platformAdminId);
    });

    it('Ordinary volunteer is forbidden from administrative reassignment', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/delivery-tasks/${seededTask.id}/reassign`)
        .set('Authorization', `Bearer ${tokenVolunteerA}`) // ORDINARY USER!
        .send({
          volunteerId: volunteerBId,
        })
        .expect(403);
    });
  });
});
