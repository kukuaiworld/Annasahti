import { apiClient, ApiClient } from './api-client';
import { Organisation } from '@/types/auth';

export class OrganisationsApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * List organizations available to the user.
   */
  async listOrganisations(): Promise<{ data: Organisation[] }> {
    return this.client.get<{ data: Organisation[] }>('/organisations');
  }

  /**
   * Get organisation details by ID.
   */
  async getOrganisationById(id: string): Promise<Organisation> {
    return this.client.get<Organisation>(`/organisations/${id}`);
  }
}

export const organisationsApi = new OrganisationsApi();
