import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface RecordSafeChainEventParams {
  batchId: string;
  eventType: string;
  description: string;
  recordedBy?: string;
  allocationId?: string;
  deliveryId?: string;
  eventData?: Record<string, any>;
}

export interface SafeChainEventRecord {
  id: string;
  batch_id: string;
  allocation_id?: string;
  delivery_id?: string;
  event_type: string;
  description: string;
  recorded_by?: string;
  recorded_by_name?: string;
  event_data: Record<string, any>;
  recorded_at: Date;
  created_at: Date;
}

@Injectable()
export class SafeChainService {
  private readonly logger = new Logger(SafeChainService.name);

  constructor(private readonly db: DatabaseService) {}

  async recordEvent(params: RecordSafeChainEventParams, client?: any): Promise<SafeChainEventRecord> {
    const sql = `
      INSERT INTO public.safechain_events (
        batch_id, event_type, description, recorded_by,
        allocation_id, delivery_id, event_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      params.batchId,
      params.eventType,
      params.description,
      params.recordedBy || null,
      params.allocationId || null,
      params.deliveryId || null,
      JSON.stringify(params.eventData || {}),
    ];

    let row: SafeChainEventRecord;
    if (client) {
      const res = await client.query(sql, values);
      row = res.rows[0];
    } else {
      row = (await this.db.queryOne<SafeChainEventRecord>(sql, values))!;
    }

    this.logger.log(`SafeChain Event recorded [${params.eventType}] for Batch ${params.batchId}`);
    return row;
  }

  async getBatchEvents(batchId: string): Promise<SafeChainEventRecord[]> {
    return this.db.query<SafeChainEventRecord>(
      `
      SELECT se.*, p.full_name as recorded_by_name
      FROM public.safechain_events se
      LEFT JOIN public.profiles p ON p.id = se.recorded_by
      WHERE se.batch_id = $1
      ORDER BY se.recorded_at ASC;
      `,
      [batchId],
    );
  }
}
