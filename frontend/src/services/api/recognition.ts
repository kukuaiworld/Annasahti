import { apiClient, ApiClient } from './api-client';
import { UserProfile } from '@/types/auth';

export class RecognitionApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * Get verified current user profile and metrics.
   */
  async getMyProfile(): Promise<UserProfile> {
    return this.client.get<UserProfile>('/recognition/me');
  }
}

export const recognitionApi = new RecognitionApi();
