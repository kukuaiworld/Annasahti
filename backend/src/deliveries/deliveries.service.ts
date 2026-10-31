import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AssignVolunteerDto } from './dto/assign-volunteer.dto';
import { ReassignVolunteerDto } from './dto/reassign-volunteer.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';
import { PickupDeliveryDto } from './dto/pickup-delivery.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { DeliveryQueryDto } from './dto/delivery-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly safechain: SafeChainService,
  ) {}

  async assignVolunteer(taskId: string, dto: AssignVolunteerDto, user: AuthUser): Promise<any> {
    return this.db.transaction(async (client) => {
      const task = (
        await client.query(
          `
          SELECT dt.*, a.batch_id, a.recipient_organisation_id, b.donor_organisation_id
          FROM public.delivery_tasks dt
          JOIN public.food_allocations a ON a.id = dt.allocation_id
          JOIN public.food_batches b ON b.id = a.batch_id
          WHERE dt.id = $1;
          `,
          [taskId],
        )
      ).rows[0];

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (['delivered', 'discrepancy_reported', 'cancelled', 'failed'].includes(task.status)) {
      throw new BadRequestException(`Cannot assign volunteer to task in "${task.status}" status.`);
    }

    // Phase 0 (Task C): only platform admins or members of the recipient or
    // donor organisation behind this allocation may assign delivery work.
    if (
      user.role !== AppRole.ADMIN &&
      user.organisationId !== task.recipient_organisation_id &&
      user.organisationId !== task.donor_organisation_id
    ) {
      throw new ForbiddenException(
        'Only platform administrators or members of the delivery\u0027s donor or recipient organisation can assign volunteers.',
      );
    }

    // Phase 0 (Task C): the caller-supplied volunteerId must resolve to a
    // trusted volunteer profile in the database - a valid UUID alone is not
    // sufficient, and profile role/account status is the only source of truth.
    const volunteer = (
      await client.query(
        `SELECT id, full_name FROM public.profiles WHERE id = $1 AND role = 'volunteer'::public.app_role AND account_status = 'active';`,
        [dto.volunteerId],
      )
    ).rows[0];

    if (!volunteer) {
      throw new NotFoundException(`Volunteer profile with ID "${dto.volunteerId}" was not found.`);
    }

    const updatedTask = (
      await client.query(
        `
        UPDATE public.delivery_tasks
        SET
          volunteer_id = $1,
          status = 'accepted'::public.delivery_status,
          pickup_deadline = COALESCE($2, pickup_deadline),
          delivery_deadline = COALESCE($3, delivery_deadline),
          delivery_notes = COALESCE($4, delivery_notes),
          accepted_at = now(),
          updated_at = now()
        WHERE id = $5
        RETURNING *;
        `,
        [
          dto.volunteerId,
          dto.pickupDeadline ? new Date(dto.pickupDeadline) : null,
          dto.deliveryDeadline ? new Date(dto.deliveryDeadline) : null,
          dto.deliveryNotes || null,
          taskId,
        ],
      )
    ).rows[0];

    await this.safechain.recordEvent(
      {
        batchId: task.batch_id,
        allocationId: task.allocation_id,
        deliveryId: taskId,
        eventType: 'volunteer_assigned',
        description: `Delivery assigned to volunteer ${volunteer.full_name} by ${user.fullName}`,
        recordedBy: user.id,
        eventData: {
          deliveryTaskId: taskId,
          volunteerId: dto.volunteerId,
          volunteerName: volunteer.full_name,
        },
      },
      client,
    );

    return {
      message: 'Volunteer successfully assigned to delivery.',
      deliveryTask: updatedTask,
    };
    }, user.id);
  }

  async claimDelivery(taskId: string, user: AuthUser): Promise<any> {
    if (user.role !== AppRole.VOLUNTEER && user.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Only active volunteers or administrators can claim delivery tasks.');
    }

    return this.db.transaction(async (client) => {
      const task = (
        await client.query(
          `
          SELECT dt.*, a.batch_id, a.recipient_organisation_id, b.donor_organisation_id
          FROM public.delivery_tasks dt
          JOIN public.food_allocations a ON a.id = dt.allocation_id
          JOIN public.food_batches b ON b.id = a.batch_id
          WHERE dt.id = $1
          FOR UPDATE;
          `,
          [taskId],
        )
      ).rows[0];

      if (!task) {
        throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
      }

      if (['delivered', 'discrepancy_reported', 'cancelled', 'failed'].includes(task.status)) {
        throw new BadRequestException(`Cannot claim delivery task in "${task.status}" status.`);
      }

      if (task.volunteer_id && task.volunteer_id !== user.id) {
        throw new BadRequestException('This delivery task has already been claimed by another volunteer.');
      }

      // Verify that volunteer profile is active in public.profiles
      const volunteer = (
        await client.query(
          `SELECT id, full_name, role FROM public.profiles WHERE id = $1 AND role = 'volunteer'::public.app_role AND account_status = 'active';`,
          [user.id],
        )
      ).rows[0];

      if (!volunteer && user.role !== AppRole.ADMIN) {
        throw new ForbiddenException('Only active registered volunteers can claim delivery tasks.');
      }

      const updatedTask = (
        await client.query(
          `
          UPDATE public.delivery_tasks
          SET
            volunteer_id = $1,
            status = 'accepted'::public.delivery_status,
            accepted_at = COALESCE(accepted_at, now()),
            updated_at = now()
          WHERE id = $2
          RETURNING *;
          `,
          [user.id, taskId],
        )
      ).rows[0];

      await this.safechain.recordEvent(
        {
          batchId: task.batch_id,
          allocationId: task.allocation_id,
          deliveryId: taskId,
          eventType: 'volunteer_assigned',
          description: `Volunteer ${user.fullName} claimed delivery task.`,
          recordedBy: user.id,
          eventData: {
            deliveryTaskId: taskId,
            volunteerId: user.id,
            selfClaimed: true,
          },
        },
        client,
      );

      return {
        message: 'Delivery task successfully claimed.',
        deliveryTask: updatedTask,
      };
    }, user.id);
  }

  async reassignVolunteer(taskId: string, dto: ReassignVolunteerDto, user: AuthUser): Promise<any> {
    return this.db.transaction(async (client) => {
      const task = (
        await client.query(
          `
          SELECT dt.*, a.batch_id, a.recipient_organisation_id, b.donor_organisation_id
          FROM public.delivery_tasks dt
          JOIN public.food_allocations a ON a.id = dt.allocation_id
          JOIN public.food_batches b ON b.id = a.batch_id
          WHERE dt.id = $1;
          `,
          [taskId],
        )
      ).rows[0];

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (['delivered', 'cancelled', 'failed'].includes(task.status)) {
      throw new BadRequestException(`Cannot reassign task in "${task.status}" status.`);
    }

    // Phase 0 (Task C): same caller authorisation as assignment. The currently
    // assigned volunteer cannot redirect a delivery to an arbitrary account.
    if (
      user.role !== AppRole.ADMIN &&
      user.organisationId !== task.recipient_organisation_id &&
      user.organisationId !== task.donor_organisation_id
    ) {
      throw new ForbiddenException(
        'Only platform administrators or members of the delivery\u0027s donor or recipient organisation can reassign volunteers.',
      );
    }

    const previousVolunteerId = task.volunteer_id;

    // Verify new volunteer profile: trusted volunteer role + active account
    const newVolunteer = (
      await client.query(
        `SELECT id, full_name FROM public.profiles WHERE id = $1 AND role = 'volunteer'::public.app_role AND account_status = 'active';`,
        [dto.newVolunteerId],
      )
    ).rows[0];

    if (!newVolunteer) {
      throw new NotFoundException(`New volunteer with ID "${dto.newVolunteerId}" was not found.`);
    }

    const updatedTask = (
      await client.query(
        `
        UPDATE public.delivery_tasks
        SET
          volunteer_id = $1,
          delivery_notes = COALESCE(delivery_notes || E'\n' || $2, $2),
          updated_at = now()
        WHERE id = $3
        RETURNING *;
        `,
        [
          dto.newVolunteerId,
          `Reassigned: ${dto.reason}`,
          taskId,
        ],
      )
    ).rows[0];

    await this.safechain.recordEvent(
      {
        batchId: task.batch_id,
        allocationId: task.allocation_id,
        deliveryId: taskId,
        eventType: 'volunteer_reassigned',
        description: `Delivery reassigned to volunteer ${newVolunteer.full_name}. Reason: ${dto.reason}`,
        recordedBy: user.id,
        eventData: {
          deliveryTaskId: taskId,
          previousVolunteerId,
          newVolunteerId: dto.newVolunteerId,
          reason: dto.reason,
        },
      },
      client,
    );

    return {
      message: 'Volunteer reassigned successfully.',
      deliveryTask: updatedTask,
    };
    }, user.id);
  }

  async cancelDelivery(taskId: string, dto: CancelDeliveryDto, user: AuthUser): Promise<any> {
    return this.db.transaction(async (client) => {
      const task = (
        await client.query(
          `
          SELECT dt.*, a.batch_id, a.recipient_organisation_id, b.donor_organisation_id
          FROM public.delivery_tasks dt
          JOIN public.food_allocations a ON a.id = dt.allocation_id
          JOIN public.food_batches b ON b.id = a.batch_id
          WHERE dt.id = $1;
          `,
          [taskId],
        )
      ).rows[0];

      if (!task) {
        throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
      }

      // Phase 0 (Task C): only admins or donor/recipient organisation members
      // may cancel. Assigned volunteers and unrelated users are denied.
      if (
        user.role !== AppRole.ADMIN &&
        user.organisationId !== task.recipient_organisation_id &&
        user.organisationId !== task.donor_organisation_id
      ) {
        throw new ForbiddenException(
          'Only platform administrators or members of the delivery\u0027s donor or recipient organisation can cancel a delivery.',
        );
      }

      if (task.status === 'delivered') {
        throw new BadRequestException('Cannot cancel a delivery that has already been confirmed as delivered.');
      }

      const updatedTask = (
        await client.query(
          `
          UPDATE public.delivery_tasks
          SET
            status = 'cancelled'::public.delivery_status,
            delivery_notes = COALESCE(delivery_notes || E'\n' || $1, $1),
            updated_at = now()
          WHERE id = $2
          RETURNING *;
          `,
          [`Cancelled: ${dto.reason}`, taskId],
        )
      ).rows[0];

      // Release reserved allocation inventory so food becomes available again
      await client.query(
        `
        UPDATE public.food_allocations
        SET status = 'cancelled'::public.allocation_status, updated_at = now()
        WHERE id = $1;
        `,
        [task.allocation_id],
      );

      await this.safechain.recordEvent(
        {
          batchId: task.batch_id,
          allocationId: task.allocation_id,
          deliveryId: taskId,
          eventType: 'delivery_cancelled',
          description: `Delivery cancelled by ${user.fullName}. Reason: ${dto.reason}`,
          recordedBy: user.id,
          eventData: {
            deliveryTaskId: taskId,
            reason: dto.reason,
          },
        },
        client,
      );

      return {
        message: 'Delivery cancelled successfully.',
        deliveryTask: updatedTask,
      };
    }, user.id);
  }

  async recordPickup(taskId: string, dto: PickupDeliveryDto, user: AuthUser): Promise<any> {
    return this.db.transaction(async (client) => {
      const task = (
        await client.query(
          `
          SELECT dt.*, a.batch_id
          FROM public.delivery_tasks dt
          JOIN public.food_allocations a ON a.id = dt.allocation_id
          WHERE dt.id = $1;
          `,
          [taskId],
        )
      ).rows[0];

      if (!task) {
        throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
      }

      // Permission check: Assigned volunteer or admin
      if (user.role !== AppRole.ADMIN && user.id !== task.volunteer_id) {
        throw new ForbiddenException('Only the assigned volunteer can record pickup for this delivery.');
      }

      if (['delivered', 'discrepancy_reported', 'cancelled', 'failed'].includes(task.status)) {
        throw new BadRequestException(`Cannot record pickup for delivery in "${task.status}" status.`);
      }

      const updatedTask = (
        await client.query(
          `
          UPDATE public.delivery_tasks
          SET
            status = 'in_transit'::public.delivery_status,
            pickup_confirmed_at = now(),
            departed_at = now(),
            delivery_notes = COALESCE(delivery_notes || E'\n' || $1, delivery_notes),
            updated_at = now()
          WHERE id = $2
          RETURNING *;
          `,
          [dto.pickupNotes ? `Pickup note: ${dto.pickupNotes}` : null, taskId],
        )
      ).rows[0];

      await this.safechain.recordEvent(
        {
          batchId: task.batch_id,
          allocationId: task.allocation_id,
          deliveryId: taskId,
          eventType: 'pickup_confirmed',
          description: `Volunteer ${user.fullName} confirmed pickup. Batch is now in transit.`,
          recordedBy: user.id,
          eventData: {
            deliveryTaskId: taskId,
            pickupNotes: dto.pickupNotes || null,
          },
        },
        client,
      );

      return {
        message: 'Pickup milestone recorded. Delivery is now in transit.',
        deliveryTask: updatedTask,
      };
    }, user.id);
  }

  async completeDelivery(taskId: string, dto: CompleteDeliveryDto, user: AuthUser): Promise<any> {
    // BUG-10 fix: the delivery confirmation and the SafeChain audit event are
    // recorded atomically - a SafeChain failure can no longer leave a confirmed
    // delivery without traceability. The transaction carries app.user_id so
    // mark_task_delivered() and the status-change triggers attribute events
    // to the acting user.
    return this.db.transaction(async (client) => {
      const task = (
        await client.query(
          `
          SELECT
            dt.*,
            a.batch_id,
            a.allocated_quantity,
            a.quantity_unit,
            a.recipient_organisation_id,
            b.donor_organisation_id
          FROM public.delivery_tasks dt
          JOIN public.food_allocations a ON a.id = dt.allocation_id
          JOIN public.food_batches b ON b.id = a.batch_id
          WHERE dt.id = $1;
          `,
          [taskId],
        )
      ).rows[0];

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (['delivered', 'discrepancy_reported'].includes(task.status)) {
      throw new BadRequestException('This delivery has already been confirmed.');
    }

    // Phase 0 (Task C): only platform admins or members of the allocation's
    // recipient organisation can confirm receipt. Donors from other
    // organisations and unrelated volunteers can never fabricate a recipient
    // confirmation, which is what FoodLoop impact metrics are built from.
    // The authenticated user is always recorded as the confirmer.
    if (user.role !== AppRole.ADMIN && user.organisationId !== task.recipient_organisation_id) {
      throw new ForbiddenException(
        'Only platform administrators or members of the recipient organisation can confirm delivery receipt.',
      );
    }

    if (dto.quantityUnit !== task.quantity_unit) {
      throw new BadRequestException(
        `Quantity unit mismatch: Confirmation provided in "${dto.quantityUnit}", but delivery task requires "${task.quantity_unit}".`,
      );
    }

    const received = Number(dto.receivedQuantity);
    const damaged = Number(dto.damagedQuantity ?? 0);
    const missing = Number(dto.missingQuantity ?? 0);
    const allocated = Number(task.allocated_quantity);

    if (Math.abs(received + damaged + missing - allocated) > 0.001) {
      throw new BadRequestException(
        `ACCOUNTING RECONCILIATION FAILED: Sum of received (${received}), damaged (${damaged}), and missing (${missing}) must equal allocated quantity (${allocated} ${task.quantity_unit}).`,
      );
    }

    // Insert into delivery_confirmations (Triggers validate quantities, update task, update batch loss)
    const confirmationSql = `
      INSERT INTO public.delivery_confirmations (
        delivery_task_id, confirmed_by, received_quantity,
        damaged_quantity, missing_quantity, quantity_unit,
        recipient_notes, evidence_urls, discrepancy_reason,
        can_be_diverted_to_waste, confirmed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      RETURNING *;
    `;

    const confirmationValues = [
      taskId,
      user.id,
      dto.receivedQuantity,
      dto.damagedQuantity ?? 0,
      dto.missingQuantity ?? 0,
      dto.quantityUnit,
      dto.recipientNotes || null,
      dto.evidenceUrls || [],
      dto.discrepancyReason || null,
      dto.canBeDivertedToWaste ?? false,
    ];

    const confirmation = (await client.query(confirmationSql, confirmationValues)).rows[0];

    const hasDiscrepancy = (dto.damagedQuantity ?? 0) > 0 || (dto.missingQuantity ?? 0) > 0;

    await this.safechain.recordEvent({
      batchId: task.batch_id,
      allocationId: task.allocation_id,
      deliveryId: taskId,
      eventType: hasDiscrepancy ? 'delivery_discrepancy_reported' : 'delivered',
      description: hasDiscrepancy
        ? `Delivery completed with reported discrepancy: Received ${dto.receivedQuantity}, Damaged ${dto.damagedQuantity}, Missing ${dto.missingQuantity} ${dto.quantityUnit}`
        : `Delivery successfully fulfilled: Received ${dto.receivedQuantity} ${dto.quantityUnit}`,
      recordedBy: user.id,
      eventData: {
        deliveryTaskId: taskId,
        receivedQuantity: dto.receivedQuantity,
        damagedQuantity: dto.damagedQuantity,
        missingQuantity: dto.missingQuantity,
        evidenceCount: (dto.evidenceUrls || []).length,
      },
    }, client);

    return {
      message: 'Delivery milestone successfully recorded and verified.',
      confirmation,
      hasDiscrepancy,
    };
    }, user.id);
  }

  async getDeliveryById(taskId: string, user: AuthUser): Promise<any> {
    const delivery = await this.db.queryOne(
      `
      SELECT 
        dt.*,
        a.batch_id,
        a.allocated_quantity,
        a.quantity_unit as allocation_unit,
        b.food_name,
        b.batch_code,
        b.category as batch_category,
        donor.name as donor_name,
        donor.address as donor_address,
        ST_Y(donor.location::geometry) as donor_lat,
        ST_X(donor.location::geometry) as donor_lng,
        ro.name as recipient_name,
        ro.address as recipient_address,
        ST_Y(ro.location::geometry) as recipient_lat,
        ST_X(ro.location::geometry) as recipient_lng,
        ST_Y(dt.volunteer_location::geometry) as volunteer_lat,
        ST_X(dt.volunteer_location::geometry) as volunteer_lng,
        dt.volunteer_location_updated_at,
        b.donor_organisation_id,
        a.recipient_organisation_id,
        p.full_name as volunteer_name,
        p.phone as volunteer_phone,
        dc.id as confirmation_id,
        dc.received_quantity,
        dc.damaged_quantity,
        dc.missing_quantity,
        dc.discrepancy_status,
        dc.discrepancy_reason,
        dc.evidence_urls as confirmation_evidence
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations donor ON donor.id = b.donor_organisation_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      LEFT JOIN public.profiles p ON p.id = dt.volunteer_id
      LEFT JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      WHERE dt.id = $1;
      `,
      [taskId],
    );

    if (!delivery) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    // Phase 0 (Task E): least-privilege detail read.
    // Allowed: ADMIN, donor/recipient organisation members of this task,
    // the assigned volunteer, and (for the legitimate claim workflow) any
    // volunteer viewing an unassigned task. Everyone else: concealed 404.
    const isOrgMember =
      user.role !== AppRole.ADMIN &&
      (user.organisationId === delivery.donor_organisation_id ||
        user.organisationId === delivery.recipient_organisation_id);

    const isAssignedVolunteer = user.role === AppRole.VOLUNTEER && delivery.volunteer_id === user.id;
    const isClaimableVolunteer = user.role === AppRole.VOLUNTEER && delivery.volunteer_id === null;

    if (
      user.role !== AppRole.ADMIN &&
      !isOrgMember &&
      !isAssignedVolunteer &&
      !isClaimableVolunteer
    ) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (user.role === AppRole.ADMIN) {
      return delivery;
    }

    return {
      ...delivery,
      // Least privilege: the volunteer's personal phone number is only exposed
      // to platform admins and organisation members - never to other roles.
      volunteer_phone: isOrgMember ? delivery.volunteer_phone : null,
    };
  }

  async listDeliveries(query: DeliveryQueryDto, user: AuthUser): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const values: any[] = [];
    let pIdx = 1;

    // Phase 0 (Task D): strict per-role scoping with default deny.
    // ADMIN: platform-wide. Volunteers: their assigned tasks plus legitimately
    // available unassigned tasks (the claim workflow). Org members: records
    // touching their active organisation. Everything else: denied.
    if (user.role !== AppRole.ADMIN) {
      const scopeClauses: string[] = [];

      if (user.role === AppRole.VOLUNTEER) {
        scopeClauses.push(`(dt.volunteer_id = $${pIdx} OR dt.volunteer_id IS NULL)`);
        values.push(user.id);
        pIdx++;
      }

      if (user.organisationId) {
        scopeClauses.push(
          `(a.recipient_organisation_id = $${pIdx} OR b.donor_organisation_id = $${pIdx})`,
        );
        values.push(user.organisationId);
        pIdx++;
      }

      if (scopeClauses.length === 0) {
        throw new ForbiddenException(
          'You have no active organisation membership or delivery relationship, so delivery lists are not available to you.',
        );
      }

      whereClauses.push(`(${scopeClauses.join(' OR ')})`);
    }

    if (query.status) {
      whereClauses.push(`dt.status = $${pIdx++}`);
      values.push(query.status);
    }

    if (query.volunteerId) {
      whereClauses.push(`dt.volunteer_id = $${pIdx++}`);
      values.push(query.volunteerId);
    }

    if (query.allocationId) {
      whereClauses.push(`dt.allocation_id = $${pIdx++}`);
      values.push(query.allocationId);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRes = await this.db.queryOne<{ total: number }>(
      `
      SELECT count(*)::int as total
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE ${whereSql};
      `,
      values,
    );
    const total = countRes ? countRes.total : 0;

    const dataSql = `
      SELECT 
        dt.*,
        a.batch_id,
        a.allocated_quantity,
        a.quantity_unit,
        b.food_name,
        b.batch_code,
        donor.name as donor_name,
        ro.name as recipient_name,
        p.full_name as volunteer_name
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations donor ON donor.id = b.donor_organisation_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      LEFT JOIN public.profiles p ON p.id = dt.volunteer_id
      WHERE ${whereSql}
      ORDER BY dt.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;
    values.push(limit, offset);

    const data = await this.db.query(dataSql, values);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * PATCH /api/v1/deliveries/:deliveryId/location
   * Updates the volunteer's current live location for an active delivery task.
   * Only the assigned volunteer (or platform admin) can submit location updates.
   * Requires explicit volunteer consent.
   */
  async updateVolunteerLocation(
    taskId: string,
    dto: UpdateLocationDto,
    user: AuthUser,
  ): Promise<any> {
    const task = await this.db.queryOne<{
      id: string;
      volunteer_id: string | null;
      status: string;
    }>(
      `SELECT id, volunteer_id, status FROM public.delivery_tasks WHERE id = $1;`,
      [taskId],
    );

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    const isPlatformAdmin = user.role === AppRole.ADMIN;
    const isAssignedVolunteer =
      user.role === AppRole.VOLUNTEER && task.volunteer_id === user.id;

    if (!isPlatformAdmin && !isAssignedVolunteer) {
      throw new ForbiddenException(
        'Only the assigned volunteer or platform administrator can update delivery task location.',
      );
    }

    if (['delivered', 'failed', 'cancelled'].includes(task.status)) {
      throw new BadRequestException(
        `Cannot update location for task in "${task.status}" status.`,
      );
    }

    if (
      dto.latitude < -90 ||
      dto.latitude > 90 ||
      dto.longitude < -180 ||
      dto.longitude > 180
    ) {
      throw new BadRequestException(
        'Latitude must be between -90 and 90, and longitude between -180 and 180.',
      );
    }

    await this.db.query(
      `
      UPDATE public.delivery_tasks
      SET 
        volunteer_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        volunteer_location_updated_at = NOW(),
        updated_at = NOW()
      WHERE id = $3;
      `,
      [dto.longitude, dto.latitude, taskId],
    );

    return {
      message: 'Volunteer location updated successfully.',
      deliveryId: taskId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      updatedAt: new Date().toISOString(),
    };
  }
}
