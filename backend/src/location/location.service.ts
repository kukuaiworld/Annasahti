import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LatLngDto } from './dto/route.dto';

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

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string | null {
    const key =
      this.configService.get<string>('GOOGLE_MAPS_API_KEY') ||
      process.env.GOOGLE_MAPS_API_KEY ||
      this.configService.get<string>('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key || key.includes('your-') || key.trim() === '') {
      return null;
    }
    return key.trim();
  }

  /**
   * Calculates Haversine great-circle distance between two WGS84 points in kilometers.
   * Used for explicit fallback reporting when external routing is unavailable.
   */
  calculateHaversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  /**
   * Geocodes an address to WGS84 coordinates using Google Geocoding API.
   * Never fabricates coordinates if the key is missing or geocoding fails.
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!address || address.trim() === '') {
      throw new BadRequestException('Address query string cannot be empty.');
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.logger.warn(
        'Geocoding requested but GOOGLE_MAPS_API_KEY is not configured in backend environment.',
      );
      return {
        success: false,
        configured: false,
        message:
          'Google Maps API key is not configured on the server. Please set GOOGLE_MAPS_API_KEY in the environment to enable address geocoding.',
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address.trim(),
      )}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        return {
          success: false,
          configured: true,
          message: `Google Geocoding HTTP error: ${res.status} ${res.statusText}`,
        };
      }

      const data = await res.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        return {
          success: true,
          configured: true,
          latitude: lat,
          longitude: lng,
          formattedAddress: result.formatted_address,
        };
      }

      return {
        success: false,
        configured: true,
        message: `Google Geocoding status: ${data.status}${
          data.error_message ? ` - ${data.error_message}` : ''
        }`,
      };
    } catch (err: any) {
      this.logger.error(`Geocoding error for "${address}": ${err.message}`);
      return {
        success: false,
        configured: true,
        message: `Geocoding request failed: ${err.message}`,
      };
    }
  }

  /**
   * Computes driving road route and duration using Google Routes API v2 (computeRoutes).
   * Returns genuine road distance, duration, and polyline.
   * If API key is not configured or fails, returns explicit error and fallback Haversine distance.
   */
  async calculateRoute(
    origin: LatLngDto,
    destination: LatLngDto,
  ): Promise<RouteResult> {
    const fallbackDist = this.calculateHaversineDistanceKm(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        configured: false,
        message:
          'Google Maps API key is not configured on the server. Set GOOGLE_MAPS_API_KEY to enable Google Routes road calculation.',
        fallbackGeodesicDistanceKm: fallbackDist,
      };
    }

    try {
      const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
      const body = {
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          configured: true,
          message: `Google Routes API HTTP error: ${res.status} - ${errorText}`,
          fallbackGeodesicDistanceKm: fallbackDist,
        };
      }

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        return {
          success: false,
          configured: true,
          message: 'No road route found between the specified coordinates.',
          fallbackGeodesicDistanceKm: fallbackDist,
        };
      }

      const primaryRoute = data.routes[0];
      const distanceMeters = primaryRoute.distanceMeters || 0;
      const distanceKm = Math.round((distanceMeters / 1000.0) * 100) / 100;

      // Duration is formatted as e.g. "1240s"
      const rawDuration = primaryRoute.duration || '0s';
      const durationSeconds = parseInt(rawDuration.replace('s', ''), 10) || 0;
      const durationMinutes = Math.round(durationSeconds / 60);
      const durationText =
        durationMinutes > 60
          ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
          : `${durationMinutes} mins`;

      return {
        success: true,
        configured: true,
        distanceKm,
        distanceMeters,
        durationSeconds,
        durationText,
        polyline: primaryRoute.polyline?.encodedPolyline,
        fallbackGeodesicDistanceKm: fallbackDist,
      };
    } catch (err: any) {
      this.logger.error(`Routes calculation error: ${err.message}`);
      return {
        success: false,
        configured: true,
        message: `Routes calculation failed: ${err.message}`,
        fallbackGeodesicDistanceKm: fallbackDist,
      };
    }
  }
}
