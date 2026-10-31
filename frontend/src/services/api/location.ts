import { apiClient, ApiClient } from './api-client';

export interface GeocodeResult {
  success: boolean;
  configured: boolean;
  message?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

export interface RouteResult {
  success: boolean;
  configured: boolean;
  message?: string;
  distanceKm?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  durationText?: string;
  polyline?: string;
  fallbackGeodesicDistanceKm?: number;
}

export class LocationApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * Geocode an address using the backend location service.
   * Endpoint: GET /api/v1/location/geocode?address=...
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    return this.client.get<GeocodeResult>('/location/geocode', {
      params: { address },
    });
  }

  /**
   * Calculate driving road route between two coordinates via Google Routes API.
   * Endpoint: POST /api/v1/location/routes
   */
  async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteResult> {
    return this.client.post<RouteResult>('/location/routes', {
      origin,
      destination,
    });
  }
}

export const locationApi = new LocationApi();
