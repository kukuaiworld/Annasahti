import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole, FoodBatchStatus, InspectionDecision } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionQueryDto } from './dto/inspection-query.dto';

export interface InspectionRecord {
  id: string;
  batch_id: string;
  inspector_id: string;
  decision: InspectionDecision;
  inspected_at: Date;
  temperature_c?: number;
  packaging_condition?: string;
  appearance_condition?: string;
  odour_condition?: string;
  handling_notes?: string;
  rejection_reason?: string;
  evidence_urls: string[];
  created_at: Date;
  is_ai_assessed: boolean;
  human_verified: boolean;
  target_species?: string[];
  safety_checklist: Record<string, any>;
  inspection_notes?: string;
}

@Injectable()
export class InspectionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly safechain: SafeChainService,
  ) {}

  async getInspectionQueue(query: InspectionQueryDto, user: AuthUser): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const countSql = `
      SELECT count(*)::int as total
      FROM public.food_batches b
      WHERE b.status IN ('pending_inspection', 'hold');
    `;
    const countRes = await this.db.queryOne<{ total: number }>(countSql);
    const total = countRes ? countRes.total : 0;

    const dataSql = `
      SELECT 
        b.id,
        b.batch_code,
        b.food_name,
        b.quantity,
        b.quantity_unit,
        b.status,
        b.best_before_at,
        b.pickup_deadline,
        b.created_at,
        o.id as donor_organisation_id,
        o.name as donor_name,
        o.address as donor_address,
        (SELECT count(*)::int FROM public.quality_inspections WHERE batch_id = b.id) as inspection_attempts
      FROM public.food_batches b
      JOIN public.organisations o ON o.id = b.donor_organisation_id
      WHERE b.status IN ('pending_inspection', 'hold')
      ORDER BY b.created_at ASC
      LIMIT $1 OFFSET $2;
    `;
    const data = await this.db.query(dataSql, [limit, offset]);

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

  async getBatchInspectionDetail(batchId: string, user: AuthUser): Promise<any> {
    const batch = await this.db.queryOne(
      `
      SELECT b.*, o.name as donor_name, o.address as donor_address
      FROM public.food_batches b
      JOIN public.organisations o ON o.id = b.donor_organisation_id
      WHERE b.id = $1;
      `,
      [batchId],
    );

    if (!batch) {
      throw new NotFoundException(`Food batch with ID "${batchId}" was not found.`);
    }

    const inspections = await this.db.query(
      `
      SELECT qi.*, p.full_name as inspector_name
      FROM public.quality_inspections qi
      JOIN public.profiles p ON p.id = qi.inspector_id
      WHERE qi.batch_id = $1
      ORDER BY qi.created_at DESC;
      `,
      [batchId],
    );

    return {
      batch,
      inspections,
    };
  }

  async recordInspection(dto: CreateInspectionDto, user: AuthUser): Promise<InspectionRecord> {
    // 1. Role enforcement: Only inspectors or admins can submit inspection decisions
    if (user.role !== AppRole.INSPECTOR && user.role !== AppRole.ADMIN) {
      throw new ForbiddenException(
        'Access denied: Only certified quality inspectors or platform administrators can record inspection decisions.',
      );
    }

    // 2. Strict Food Safety Rule 1: AI cannot independently approve food for human or animal consumption
    if (dto.isAiAssessed === true && dto.humanVerified === false) {
      if (
        dto.decision === InspectionDecision.APPROVED_HUMAN ||
        dto.decision === InspectionDecision.APPROVED_ANIMAL
      ) {
        throw new ForbiddenException(
          'FOOD SAFETY VIOLATION: AI models are strictly prohibited from approving food for human or animal consumption without certified human signoff.',
        );
      }
    }

    // 3. Strict Food Safety Rule 2: Animal food suitability must be species-specific
    if (dto.decision === InspectionDecision.APPROVED_ANIMAL) {
      if (!dto.targetSpecies || dto.targetSpecies.length === 0) {
        throw new BadRequestException(
          'FOOD SAFETY REQUIREMENT: Animal suitability decisions require explicit target species specification (e.g. canine, feline, bovine, poultry).',
        );
      }
    }

    // 4. Batch verification
    const batch = await this.db.queryOne(
      `SELECT * FROM public.food_batches WHERE id = $1;`,
      [dto.batchId],
    );

    if (!batch) {
      throw new NotFoundException(`Food batch with ID "${dto.batchId}" was not found.`);
    }

    if (![FoodBatchStatus.PENDING_INSPECTION, FoodBatchStatus.HOLD].includes(batch.status)) {
      throw new BadRequestException(
        `Batch is in status "${batch.status}". Only batches pending inspection or on hold can be inspected.`,
      );
    }

    const sql = `
      INSERT INTO public.quality_inspections (
        batch_id, inspector_id, decision,
        inspected_at, temperature_c, packaging_condition, appearance_condition,
        odour_condition, handling_notes, rejection_reason, evidence_urls,
        is_ai_assessed, human_verified, target_species, safety_checklist,
        inspection_notes
      )
      VALUES ($1, $2, $3, now(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const values = [
      dto.batchId,
      user.id,
      dto.decision,
      dto.temperatureC || null,
      dto.packagingCondition || null,
      dto.appearanceCondition || null,
      dto.odourCondition || null,
      dto.handlingNotes || null,
      dto.rejectionReason || null,
      dto.evidenceUrls || [],
      dto.isAiAssessed ?? false,
      dto.humanVerified ?? true,
      dto.targetSpecies || null,
      JSON.stringify(dto.safetyChecklist || {}),
      dto.inspectionNotes || null,
    ];

    const inspection = (await this.db.queryOne<InspectionRecord>(sql, values))!;

    // SafeChain event recording
    await this.safechain.recordEvent({
      batchId: dto.batchId,
      eventType: 'inspection_completed',
      description: `Inspection completed by certified inspector ${user.fullName}. Decision: ${dto.decision}`,
      recordedBy: user.id,
      eventData: {
        inspectionId: inspection.id,
        decision: dto.decision,
        targetSpecies: dto.targetSpecies || null,
        temperatureC: dto.temperatureC || null,
        evidenceCount: (dto.evidenceUrls || []).length,
      },
    });

    if (
      dto.decision === InspectionDecision.APPROVED_HUMAN ||
      dto.decision === InspectionDecision.APPROVED_ANIMAL ||
      dto.decision === InspectionDecision.APPROVED_ORGANIC_WASTE
    ) {
      await this.safechain.recordEvent({
        batchId: dto.batchId,
        eventType: 'batch_approved',
        description: `Batch approved for destination: ${dto.decision}`,
        recordedBy: user.id,
        eventData: { decision: dto.decision },
      });
    } else if (dto.decision === InspectionDecision.REJECTED) {
      await this.safechain.recordEvent({
        batchId: dto.batchId,
        eventType: 'batch_rejected',
        description: `Batch rejected. Reason: ${dto.rejectionReason || 'Unspecified'}`,
        recordedBy: user.id,
        eventData: { rejectionReason: dto.rejectionReason },
      });
    }

    return inspection;
  }
}
