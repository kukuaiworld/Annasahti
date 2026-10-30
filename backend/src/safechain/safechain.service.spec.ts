import { Test, TestingModule } from '@nestjs/testing';
import { SafeChainService } from './safechain.service';
import { DatabaseService } from '../database/database.service';

describe('SafeChainService', () => {
  let service: SafeChainService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafeChainService,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();

    service = module.get<SafeChainService>(SafeChainService);
  });

  describe('recordEvent', () => {
    it('should insert a safechain event using DatabaseService when no client is passed', async () => {
      const mockResult = {
        id: 'event-uuid-1',
        batch_id: 'batch-1',
        event_type: 'batch_created',
        description: 'New batch created',
        recorded_at: new Date(),
        created_at: new Date(),
      };

      dbMock.queryOne.mockResolvedValue(mockResult);

      const result = await service.recordEvent({
        batchId: 'batch-1',
        eventType: 'batch_created',
        description: 'New batch created',
        recordedBy: 'user-1',
        eventData: { foodName: 'Apples' },
      });

      expect(dbMock.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.safechain_events'),
        expect.arrayContaining(['batch-1', 'batch_created', 'New batch created']),
      );
      expect(result.id).toBe('event-uuid-1');
    });

    it('should use transaction client if passed', async () => {
      const clientMock = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              id: 'event-uuid-tx',
              batch_id: 'batch-tx',
              event_type: 'allocation_created',
            },
          ],
        }),
      };

      const result = await service.recordEvent(
        {
          batchId: 'batch-tx',
          eventType: 'allocation_created',
          description: 'Allocation event',
        },
        clientMock,
      );

      expect(clientMock.query).toHaveBeenCalled();
      expect(dbMock.queryOne).not.toHaveBeenCalled();
      expect(result.id).toBe('event-uuid-tx');
    });
  });

  describe('getBatchEvents', () => {
    it('should return events ordered by recorded_at DESC with recorded_by_name', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          batch_id: 'batch-1',
          event_type: 'batch_created',
          recorded_by_name: 'Chef Marco',
        },
      ];

      dbMock.query.mockResolvedValue(mockEvents);

      const result = await service.getBatchEvents('batch-1');

      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM public.safechain_events'),
        ['batch-1'],
      );
      expect(result.length).toBe(1);
      expect(result[0].recorded_by_name).toBe('Chef Marco');
    });
  });
});
