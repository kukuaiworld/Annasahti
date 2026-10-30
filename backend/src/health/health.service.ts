import { Injectable } from '@nestjs/common';
import { HealthResponse } from './health.interface';

@Injectable()
export class HealthService {
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'FoodLoop API',
    };
  }
}
