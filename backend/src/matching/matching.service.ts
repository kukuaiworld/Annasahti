import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FoodBatchStatus, FoodCategory } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { MatchQueryDto } from './dto/match-query.dto';
import { RecipientSearchDto } from './dto/recipient-search.dto';

export interface MatchResult {
  recipientOrganisationId: string;
  recipientName: string;
  organisationType: string;
  address?: string;
  isEligible: boolean;
  exclusionReasons: string[];
  matchScore: number;
  distanceKm: number | null;
  batchAvailableQuantity: number;
  recipientRequestedQuantity: number;
  recipientStorageCapacityKg: number | null;
  quantityUnit: string;
  warnings: string[];
  factors: string[];
}

@Injectable()
export class MatchingService {
  constructor(private readonly db: DatabaseService) {}

  async findMatchesForBatch(
    batchId: string,
    query: MatchQueryDto,
    user: AuthUser,
  ): Promise<{ batch: any; matches: MatchResult[] }> {
    const maxDistanceKm = query.maxDistanceKm ?? 25;
    const limit = query.limit ?? 10;

    // 1. Retrieve the batch and its donor location
    const batchSql = `
      SELECT 
        b.*,
        o.name as donor_name,
        o.address as donor_address,
        o.location as donor_location,
        ST_Y(o.location::geometry) as donor_lat,
        ST_X(o.location::geometry) as donor_lng
      FROM public.food_batches b
      JOIN public.organisations o ON o.id = b.donor_organisation_id
      WHERE b.id = $1;
    `;

    const batch = await this.db.queryOne(batchSql, [batchId]);

    if (!batch) {
      throw new NotFoundException(`Food batch with ID "${batchId}" was not found.`);
    }

    // 2. Strict Pre-condition: Batch must be approved and eligible for distribution
    if (![FoodBatchStatus.APPROVED, FoodBatchStatus.PARTIALLY_ALLOCATED].includes(batch.status)) {
      throw new BadRequestException(
        `SAFETY FILTER: Batch "${batch.batch_code}" is currently in status "${batch.status}". Only approved batches can be matched for recipient allocation.`,
      );
    }

    if (!batch.category) {
      throw new BadRequestException(
        `SAFETY FILTER: Batch "${batch.batch_code}" has no classified destination category. Complete human inspection first.`,
      );
    }

    const availableQty = Number(batch.available_quantity ?? (
      Number(batch.quantity) - Number(batch.allocated_quantity) - Number(batch.damaged_quantity) - Number(batch.missing_quantity)
    ));

    if (availableQty <= 0) {
      throw new BadRequestException(
        `QUANTITY FILTER: Batch "${batch.batch_code}" has 0 remaining available quantity to allocate.`,
      );
    }

    // 3. Retrieve target species from latest inspection if animal feed
    let targetSpecies: string[] = [];
    if (batch.category === FoodCategory.ANIMAL_APPROPRIATE) {
      const inspection = await this.db.queryOne(
        `SELECT target_species FROM public.quality_inspections WHERE batch_id = $1 AND decision = 'approved_animal' ORDER BY created_at DESC LIMIT 1;`,
        [batchId],
      );
      if (inspection && inspection.target_species) {
        targetSpecies = inspection.target_species;
      }
    }

    // 4. Query recipient organisations and requirements using PostGIS spatial calculation
    const recipientSql = `
      SELECT 
        o.id as organisation_id,
        o.name as organisation_name,
        o.organisation_type,
        o.verification_status,
        o.address,
        o.operating_hours,
        rr.id as requirement_id,
        rr.accepted_categories,
        rr.requested_quantity,
        rr.quantity_unit,
        rr.storage_capacity_kg,
        rr.supported_species,
        rr.is_active,
        CASE 
          WHEN o.location IS NOT NULL AND b.donor_location IS NOT NULL 
          THEN ROUND((ST_Distance(o.location, b.donor_location) / 1000.0)::numeric, 2)
          ELSE NULL 
        END as distance_km
      FROM public.organisations o
      JOIN public.recipient_requirements rr ON rr.organisation_id = o.id
      CROSS JOIN (
        SELECT location as donor_location FROM public.organisations WHERE id = $1
      ) b
      WHERE rr.is_active = true
      ORDER BY distance_km ASC NULLS LAST;
    `;

    const recipientRows = await this.db.query(recipientSql, [batch.donor_organisation_id]);

    // 5. Evaluate eligibility and rank matches
    const evaluatedMatches: MatchResult[] = [];

    for (const row of recipientRows) {
      const exclusionReasons: string[] = [];
      const warnings: string[] = [];
      const factors: string[] = [];
      let score = 50; // base score

      // Condition 1: Verification status
      if (row.verification_status !== 'verified') {
        exclusionReasons.push(`Organisation verification status is "${row.verification_status}" (must be verified).`);
      }

      // Condition 2: Destination suitability & Organisation type
      if (batch.category === FoodCategory.HUMAN_CONSUMPTION) {
        const humanOrgTypes = ['humanitarian_ngo', 'orphanage', 'government_school', 'old_age_home', 'other'];
        if (!humanOrgTypes.includes(row.organisation_type)) {
          exclusionReasons.push(`Organisation type "${row.organisation_type}" is not authorized for human food distribution.`);
        }
        if (!row.accepted_categories.includes(FoodCategory.HUMAN_CONSUMPTION)) {
          exclusionReasons.push('Recipient requirements do not accept human consumption food.');
        } else {
          factors.push('Compatible destination: Human Consumption');
          score += 20;
        }
      } else if (batch.category === FoodCategory.ANIMAL_APPROPRIATE) {
        if (row.organisation_type !== 'animal_welfare_ngo') {
          exclusionReasons.push(`Organisation type "${row.organisation_type}" is not an animal welfare organisation.`);
        }
        if (!row.accepted_categories.includes(FoodCategory.ANIMAL_APPROPRIATE)) {
          exclusionReasons.push('Recipient requirements do not accept animal feed.');
        } else {
          factors.push('Compatible destination: Animal Welfare Feed');
          score += 15;
        }

        // Species-specific suitability matching
        if (targetSpecies.length > 0) {
          const supported = row.supported_species || [];
          const hasSpeciesOverlap = targetSpecies.some((s) => supported.includes(s));
          if (!hasSpeciesOverlap) {
            exclusionReasons.push(
              `SPECIES INCOMPATIBLE: Batch certified for [${targetSpecies.join(', ')}], but recipient only supports [${supported.join(', ') || 'none'}].`,
            );
          } else {
            factors.push(`Species suitability verified: overlaps with [${targetSpecies.join(', ')}]`);
            score += 15;
          }
        }
      } else if (batch.category === FoodCategory.ORGANIC_WASTE) {
        if (row.organisation_type !== 'waste_processor') {
          exclusionReasons.push(`Organisation type "${row.organisation_type}" is not an authorized waste processor.`);
        }
        if (!row.accepted_categories.includes(FoodCategory.ORGANIC_WASTE)) {
          exclusionReasons.push('Recipient requirements do not accept organic waste.');
        } else {
          factors.push('Compatible destination: Certified Waste Processing');
          score += 20;
        }
      }

      // Condition 3: Distance calculation
      const dist = row.distance_km !== null ? Number(row.distance_km) : null;
      if (dist !== null) {
        if (dist > maxDistanceKm) {
          exclusionReasons.push(`Distance (${dist} km) exceeds requested radius (${maxDistanceKm} km).`);
        } else {
          factors.push(`Within distance radius: ${dist} km`);
          // Closer recipients receive higher score
          if (dist <= 5) score += 20;
          else if (dist <= 15) score += 10;
          else score += 5;
        }
      } else {
        warnings.push('Distance not calculated: Missing geographic coordinates on recipient or donor profile.');
      }

      // Condition 4: Storage Capacity & Quantity Match
      const storageCap = row.storage_capacity_kg !== null ? Number(row.storage_capacity_kg) : null;
      if (storageCap !== null) {
        if (storageCap < availableQty) {
          warnings.push(`Storage capacity (${storageCap} kg) is less than entire batch (${availableQty} kg). Partial allocation suggested.`);
          score += 5;
        } else {
          factors.push(`Sufficient storage capacity verified: ${storageCap} kg`);
          score += 15;
        }
      }

      const reqQty = Number(row.requested_quantity || 0);
      if (reqQty > 0) {
        factors.push(`Active recipient demand: ${reqQty} ${row.quantity_unit || 'kg'}`);
        score += 10;
      }

      const isEligible = exclusionReasons.length === 0;

      evaluatedMatches.push({
        recipientOrganisationId: row.organisation_id,
        recipientName: row.organisation_name,
        organisationType: row.organisation_type,
        address: row.address,
        isEligible,
        exclusionReasons,
        matchScore: isEligible ? Math.min(100, score) : 0,
        distanceKm: dist,
        batchAvailableQuantity: availableQty,
        recipientRequestedQuantity: reqQty,
        recipientStorageCapacityKg: storageCap,
        quantityUnit: batch.quantity_unit,
        warnings,
        factors,
      });
    }

    // Sort: Eligible first, then highest score, then shortest distance
    evaluatedMatches.sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return 0;
    });

    return {
      batch: {
        id: batch.id,
        batchCode: batch.batch_code,
        foodName: batch.food_name,
        category: batch.category,
        availableQuantity: availableQty,
        quantityUnit: batch.quantity_unit,
        pickupDeadline: batch.pickup_deadline,
        donorName: batch.donor_name,
      },
      matches: evaluatedMatches.slice(0, limit),
    };
  }

  async searchEligibleRecipients(query: RecipientSearchDto, user: AuthUser): Promise<any> {
    const radiusKm = query.radiusKm ?? 25;
    const limit = query.limit ?? 20;

    let distanceExpr = 'NULL::numeric';
    let distanceFilter = '';
    const params: any[] = [];
    let pIdx = 1;

    if (query.lat !== undefined && query.lng !== undefined) {
      params.push(query.lng, query.lat);
      const pointSql = `ST_SetSRID(ST_MakePoint($${pIdx++}, $${pIdx++}), 4326)::geography`;
      distanceExpr = `ROUND((ST_Distance(o.location, ${pointSql}) / 1000.0)::numeric, 2)`;
      params.push(radiusKm * 1000);
      distanceFilter = `AND (o.location IS NULL OR ST_DWithin(o.location, ${pointSql}, $${pIdx++}))`;
    }

    let categoryFilter = '';
    if (query.category) {
      params.push(query.category);
      categoryFilter = `AND $${pIdx++} = ANY(rr.accepted_categories)`;
    }

    let speciesFilter = '';
    if (query.species) {
      params.push(query.species);
      speciesFilter = `AND $${pIdx++} = ANY(rr.supported_species)`;
    }

    const sql = `
      SELECT 
        o.id as organisation_id,
        o.name as organisation_name,
        o.organisation_type,
        o.address,
        rr.accepted_categories,
        rr.supported_species,
        rr.requested_quantity,
        rr.quantity_unit,
        rr.storage_capacity_kg,
        ${distanceExpr} as distance_km
      FROM public.organisations o
      JOIN public.recipient_requirements rr ON rr.organisation_id = o.id
      WHERE o.verification_status = 'verified'
        AND rr.is_active = true
        ${categoryFilter}
        ${speciesFilter}
        ${distanceFilter}
      ORDER BY distance_km ASC NULLS LAST
      LIMIT $${pIdx++};
    `;
    params.push(limit);

    const rows = await this.db.query(sql, params);
    return { data: rows };
  }
}
