import { apiClient, ApiClient } from './api-client';
import {
  BatchInspectionDetailResponse,
  CreateInspectionDto,
  InspectionQueryDto,
  InspectionQueueResponse,
  InspectionRecord,
} from '@/types/inspections';

export class InspectionsApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * Fetch the inspection queue containing batches awaiting human inspection (pending_inspection or hold).
   * Backend endpoint: GET /api/v1/inspections/queue
   */
  async getInspectionQueue(query: InspectionQueryDto = {}): Promise<InspectionQueueResponse> {
    return this.client.get<InspectionQueueResponse>('/inspections/queue', {
      params: {
        page: query.page,
        limit: query.limit,
      },
    });
  }

  /**
   * Fetch batch details and previous inspection history for a specific batch.
   * Backend endpoint: GET /api/v1/inspections/batch/:batchId
   */
  async getBatchInspectionDetail(batchId: string): Promise<BatchInspectionDetailResponse> {
    return this.client.get<BatchInspectionDetailResponse>(`/inspections/batch/${batchId}`);
  }

  /**
   * Submit an authorized human inspection decision.
   * Backend endpoint: POST /api/v1/inspections
   */
  async recordInspection(dto: CreateInspectionDto): Promise<InspectionRecord> {
    return this.client.post<InspectionRecord>('/inspections', dto);
  }
}

export const inspectionsApi = new InspectionsApi();
