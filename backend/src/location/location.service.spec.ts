import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'GOOGLE_MAPS_API_KEY') return null;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateHaversineDistanceKm', () => {
    it('correctly calculates known great-circle distance between two coordinates', () => {
      // Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777) ~ 1148 km
      const distance = service.calculateHaversineDistanceKm(
        28.6139,
        77.209,
        19.076,
        72.8777,
      );
      expect(distance).toBeGreaterThan(1140);
      expect(distance).toBeLessThan(1160);
    });

    it('returns 0 for identical points', () => {
      const distance = service.calculateHaversineDistanceKm(
        28.6139,
        77.209,
        28.6139,
        77.209,
      );
      expect(distance).toBe(0);
    });
  });

  describe('geocodeAddress', () => {
    it('returns configured=false and explicit message when API key is missing', async () => {
      const result = await service.geocodeAddress('Connaught Place, New Delhi');
      expect(result.configured).toBe(false);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Google Maps API key is not configured');
    });
  });

  describe('calculateRoute', () => {
    it('returns configured=false with explicit fallback geodesic distance when API key is missing', async () => {
      const origin = { latitude: 28.7041, longitude: 77.1025 };
      const destination = { latitude: 28.6139, longitude: 77.209 };

      const result = await service.calculateRoute(origin, destination);
      expect(result.configured).toBe(false);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Google Maps API key is not configured');
      expect(result.fallbackGeodesicDistanceKm).toBeGreaterThan(0);
    });
  });
});
